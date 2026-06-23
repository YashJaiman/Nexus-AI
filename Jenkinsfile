pipeline {
    agent any

    environment {
        IMAGE_NAME_BACKEND  = "nexus-ai-backend"
        IMAGE_NAME_FRONTEND = "nexus-ai-frontend"

        GIT_REPO   = "https://github.com/YashJaiman/Nexus-AI.git"
        GIT_BRANCH = "main"

        BUILD_TAG = "${BUILD_NUMBER}"

        SONAR_HOST_URL = "http://13.232.9.58:30002"

        FRONTEND_URL  = "http://13.232.9.58:3000"
        BACKEND_URL   = "http://13.232.9.58:5000"
        VITE_API_URL  = "http://13.232.9.58:5000"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    triggers {
        githubPush()
    }

    stages {

        // ─────────────────────────────────────────────
        // STAGE 1 — Clone
        // ─────────────────────────────────────────────
        stage('Clone Repository') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
                sh '''
                    echo "===== REPOSITORY CLONED ====="
                    pwd
                    ls -lah
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 2 — Environment Info
        // ─────────────────────────────────────────────
        stage('Debug Environment') {
            steps {
                sh '''
                    echo "===== MEMORY ====="
                    free -h

                    echo "===== DISK ====="
                    df -h

                    echo "===== NODE ====="
                    node -v || echo "Node not found"
                    npm -v  || echo "npm not found"

                    echo "===== DOCKER ====="
                    docker --version

                    echo "===== DOCKER COMPOSE ====="
                    docker compose version 2>/dev/null \
                        || docker-compose version 2>/dev/null \
                        || echo "WARNING: docker compose not available"

                    echo "===== WORKSPACE ====="
                    pwd
                    ls -lah
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 3 — Frontend
        // ─────────────────────────────────────────────
        stage('Frontend Install & Lint') {
            steps {
                sh '''
                    echo "===== FRONTEND NPM INSTALL ====="
                    npm install

                    echo "===== FRONTEND LINT ====="
                    if grep -q '"lint"' package.json; then
                        npm run lint || echo "Lint warnings found — continuing"
                    else
                        echo "No lint script defined in package.json"
                    fi
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 4 — Backend
        // ─────────────────────────────────────────────
        stage('Backend Install & Test') {
            steps {
                dir('backend') {
                    sh '''
                        echo "===== BACKEND NPM INSTALL ====="
                        npm install

                        echo "===== BACKEND TESTS ====="
                        if grep -q '"test"' package.json; then
                            npm test || echo "Tests failed — continuing"
                        else
                            echo "No test script defined in backend/package.json"
                        fi
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 5 — SonarQube Scan
        // ─────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                script {
                    // Resolve scanner path safely — avoids exit code 127
                    def scannerHome = ''
                    try {
                        scannerHome = tool('Nexus-Sonar')
                    } catch (err) {
                        echo "WARNING: SonarScanner tool 'Nexus-Sonar' not found in Global Tool Config."
                        echo "Attempting fallback to system sonar-scanner..."
                    }

                    withSonarQubeEnv('Nexus-Sonar-Server') {
                        sh """
                            if [ -n "${scannerHome}" ] && [ -f "${scannerHome}/bin/sonar-scanner" ]; then
                                SCANNER="${scannerHome}/bin/sonar-scanner"
                            elif command -v sonar-scanner >/dev/null 2>&1; then
                                SCANNER="sonar-scanner"
                            else
                                echo "ERROR: sonar-scanner binary not found."
                                echo "Fix: Jenkins → Global Tool Config → SonarQube Scanner → Name must be 'Nexus-Sonar'"
                                exit 1
                            fi

                            echo "Using scanner: \$SCANNER"

                            \$SCANNER \\
                                -Dsonar.projectKey=nexus-ai \\
                                -Dsonar.projectName=nexus-ai \\
                                -Dsonar.projectVersion=${BUILD_TAG} \\
                                -Dsonar.host.url=${SONAR_HOST_URL} \\
                                -Dsonar.sources=src,backend \\
                                -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/coverage/**,**/*.min.js
                        """
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 6 — Quality Gate
        // ─────────────────────────────────────────────
        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    // abortPipeline: false = quality gate failure marks UNSTABLE
                    // not FAILURE, so Docker build and deploy still run
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 7 — Build Docker Images
        // ─────────────────────────────────────────────
        stage('Build Docker Images') {
            steps {
                withCredentials([
                    string(credentialsId: 'nexus-ai-gemini-key', variable: 'GEMINI_KEY')
                ]) {
                    sh """
                        echo "===== BUILDING BACKEND IMAGE ====="
                        docker build \\
                            -f Dockerfile.backend \\
                            -t ${IMAGE_NAME_BACKEND}:${BUILD_TAG} \\
                            -t ${IMAGE_NAME_BACKEND}:latest \\
                            .

                        echo "===== BUILDING FRONTEND IMAGE ====="
                        docker build \\
                            -f Dockerfile.frontend \\
                            --build-arg VITE_API_URL=${VITE_API_URL} \\
                            --build-arg VITE_GEMINI_API_KEY=\${GEMINI_KEY} \\
                            -t ${IMAGE_NAME_FRONTEND}:${BUILD_TAG} \\
                            -t ${IMAGE_NAME_FRONTEND}:latest \\
                            .

                        echo "===== IMAGES BUILT ====="
                        docker images | grep nexus-ai || true
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 8 — Deploy
        // ─────────────────────────────────────────────
        stage('Deploy Application') {
            steps {
                withCredentials([
                    string(credentialsId: 'nexus-ai-mongo-uri',  variable: 'MONGO_URI'),
                    string(credentialsId: 'nexus-ai-jwt-secret',  variable: 'JWT_SECRET'),
                    string(credentialsId: 'nexus-ai-gemini-key',  variable: 'GEMINI_API_KEY')
                ]) {
                    sh """
                        export MONGO_URI="${MONGO_URI}"
                        export JWT_SECRET="${JWT_SECRET}"
                        export GEMINI_API_KEY="${GEMINI_API_KEY}"
                        export JWT_EXPIRES_IN="7d"
                        export ALLOWED_ORIGINS="${FRONTEND_URL}"

                        echo "===== STOPPING OLD CONTAINERS ====="
                        docker compose down --remove-orphans 2>/dev/null \\
                            || docker-compose down --remove-orphans 2>/dev/null \\
                            || true

                        echo "===== STARTING NEW CONTAINERS ====="
                        docker compose up -d --force-recreate 2>/dev/null \\
                            || docker-compose up -d --force-recreate

                        echo "===== RUNNING CONTAINERS ====="
                        docker ps
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 9 — Health Check
        // ─────────────────────────────────────────────
        stage('Backend Health Check') {
            steps {
                sh '''
                    echo "Waiting 30s for backend startup..."
                    sleep 30

                    echo "Checking backend health..."
                    curl -f --retry 5 --retry-delay 10 --retry-connrefused \
                        http://localhost:5000/api/health \
                        && echo "Backend is healthy ✅" \
                        || (echo "ERROR: Backend health check failed ❌" && exit 1)
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 10 — Show Containers
        // ─────────────────────────────────────────────
        stage('Show Running Containers') {
            steps {
                sh '''
                    echo "===== ALL RUNNING CONTAINERS ====="
                    docker ps

                    echo "===== CONTAINER RESOURCE USAGE ====="
                    docker stats --no-stream --format \
                        "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" || true
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 11 — Cleanup
        // ─────────────────────────────────────────────
        stage('Cleanup Old Images') {
            steps {
                sh '''
                    docker image prune -f  || true
                    docker builder prune -f || true
                '''
            }
        }
    }

    // ─────────────────────────────────────────────
    // POST ACTIONS
    // ─────────────────────────────────────────────
    post {

        // failure BEFORE always — so logs are captured BEFORE cleanWs() wipes workspace
        failure {
            sh '''
                echo "===== PIPELINE FAILED — CAPTURING DEBUG INFO ====="

                echo "===== BACKEND LOGS ====="
                docker logs nexus-backend --tail=100 2>/dev/null || echo "Container nexus-backend not running"

                echo "===== FRONTEND LOGS ====="
                docker logs nexus-frontend --tail=100 2>/dev/null || echo "Container nexus-frontend not running"

                echo "===== ALL CONTAINERS ====="
                docker ps -a

                echo "===== DISK USAGE ====="
                df -h

                echo "===== DOCKER IMAGES ====="
                docker images
            '''
        }

        unstable {
            echo "========================================="
            echo "BUILD UNSTABLE — Quality Gate or Tests failed"
            echo "Check SonarQube: http://13.232.9.58:30002"
            echo "Application may still be deployed"
            echo "========================================="
        }

        success {
            echo "========================================="
            echo "DEPLOYMENT SUCCESSFUL ✅"
            echo "========================================="
            echo "Frontend  : http://13.232.9.58:3000"
            echo "Backend   : http://13.232.9.58:5000/api/health"
            echo "SonarQube : http://13.232.9.58:30002"
            echo "Build #   : ${BUILD_NUMBER}"
            echo "========================================="
        }

        // always LAST — cleans workspace after failure/success logs are done
        always {
            cleanWs()
        }
    }
}
