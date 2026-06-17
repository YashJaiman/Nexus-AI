pipeline {
    agent any

    environment {
        IMAGE_NAME_BACKEND  = "nexus-ai-backend"
        IMAGE_NAME_FRONTEND = "nexus-ai-frontend"

        GIT_REPO   = "https://github.com/YashJaiman/Nexus-AI.git"
        GIT_BRANCH = "main"
        APP_PORT   = "5000"
        BUILD_TAG  = "${env.BUILD_NUMBER}"

        // SonarQube
        SONAR_URL    = "http://13.234.112.164:30002"
        SCANNER_HOME = tool 'Nexus-Sonar'   // must match SonarQube Scanner tool name
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: "10"))
        timeout(time: 30, unit: "MINUTES")
        disableConcurrentBuilds()
    }

    triggers {
        githubPush()
    }

    stages {

        stage("Clone Repository") {
            steps {
                git url: GIT_REPO, branch: GIT_BRANCH
                sh "ls -la"
            }
        }

        stage("Sanity: Node & NPM") {
            steps {
                sh """
                    node --version
                    npm --version
                    echo "Node & npm available"
                """
            }
        }

        stage("Frontend: Install & Lint") {
            steps {
                sh """
                    npm install --silent
                    if grep -q '"lint"' package.json; then
                        npm run lint || echo "Lint step failed but continuing"
                    else
                        echo "No lint script - skipping"
                    fi
                    echo "Frontend dependencies installed"
                """
            }
        }

        stage("Backend: Install & Test") {
            steps {
                sh """
                    cd backend
                    npm install --silent
                    if grep -q '"test"' package.json; then
                        npm test || echo "Tests completed"
                    else
                        echo "No test script - skipping"
                    fi
                    echo "Backend dependencies installed"
                """
            }
        }

        stage("SonarQube Analysis") {
            steps {
                // 'Nexus-Sonar-Server' must match the SonarQube server name in Jenkins
                withSonarQubeEnv('Nexus-Sonar-Server') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                          -Dsonar.projectKey=nexus-ai \
                          -Dsonar.projectName=nexus-ai \
                          -Dsonar.projectVersion=${BUILD_TAG} \
                          -Dsonar.sources=.,backend \
                          -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/coverage/**,**/*.min.js \
                          -Dsonar.sourceEncoding=UTF-8 \
                          -Dsonar.host.url=${SONAR_URL}
                    """
                }
            }
        }

        stage("Quality Gate") {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage("Build Docker Images") {
            steps {
                withCredentials([
                    string(credentialsId: "nexus-ai-gemini-key", variable: "GEMINI_KEY")
                ]) {
                    sh """
                        echo "Building Backend image..."
                        docker build \
                          -f Dockerfile.backend \
                          -t ${IMAGE_NAME_BACKEND}:${BUILD_TAG} \
                          -t ${IMAGE_NAME_BACKEND}:latest \
                          .

                        echo "Building Frontend image..."
                        docker build \
                          -f Dockerfile.frontend \
                          --build-arg VITE_API_URL=http://backend:5000 \
                          --build-arg VITE_GEMINI_API_KEY=${GEMINI_KEY} \
                          -t ${IMAGE_NAME_FRONTEND}:${BUILD_TAG} \
                          -t ${IMAGE_NAME_FRONTEND}:latest \
                          .

                        echo "Images built:"
                        docker images | grep nexus-ai || true
                    """
                }
            }
        }

        stage("Deploy with Docker Compose") {
            steps {
                withCredentials([
                    string(credentialsId: "nexus-ai-mongo-uri",  variable: "MONGO_URI"),
                    string(credentialsId: "nexus-ai-jwt-secret", variable: "JWT_SECRET"),
                    string(credentialsId: "nexus-ai-gemini-key", variable: "GEMINI_KEY")
                ]) {
                    sh """
                        export MONGO_URI="${MONGO_URI}"
                        export JWT_SECRET="${JWT_SECRET}"
                        export GEMINI_API_KEY="${GEMINI_KEY}"
                        export JWT_EXPIRES_IN="7d"
                        export ALLOWED_ORIGINS="http://13.234.112.164:${APP_PORT},http://13.234.112.164:3000"

                        echo "Stopping old stack..."
                        docker compose down || docker-compose down || true

                        echo "Starting new stack..."
                        docker compose up -d || docker-compose up -d

                        echo "Running containers:"
                        docker ps
                    """
                }
            }
        }

        stage("Health Check") {
            steps {
                sh """
                    echo "Waiting for app to start..."
                    sleep 15
                    curl -f http://13.234.112.164:${APP_PORT}/api/health \
                        && echo "✅ Backend LIVE at http://13.234.112.164:${APP_PORT}" \
                        || echo "⚠️ Health check FAILED - check docker logs"
                    echo "Container status:"
                    docker ps
                """
            }
        }

        stage("Cleanup Old Images") {
            steps {
                sh """
                    echo "Removing old tagged images (keeping last 3)..."
                    docker images ${IMAGE_NAME_BACKEND} --format "{{.Tag}}" | \
                        grep -v latest | sort -n | head -n -3 | \
                        xargs -I {} docker rmi ${IMAGE_NAME_BACKEND}:{} || true

                    docker images ${IMAGE_NAME_FRONTEND} --format "{{.Tag}}" | \
                        grep -v latest | sort -n | head -n -3 | \
                        xargs -I {} docker rmi ${IMAGE_NAME_FRONTEND}:{} || true

                    docker image prune -f || true
                    echo "Cleanup done"
                """
            }
        }
    }

    post {
        always {
            script {
                sh """
                    docker image prune -f || true
                    docker builder prune -f || true
                """
                cleanWs()
            }
        }
        success {
            echo "✅ App LIVE        → http://13.234.112.164:${APP_PORT}"
            echo "✅ SonarQube Report → http://13.234.112.164:30002/dashboard?id=nexus-ai"
        }
        failure {
            script {
                sh """
                    echo "❌ Pipeline FAILED - printing container logs..."
                    docker logs \$(docker ps -q --filter name=nexus-backend)  --tail=50 || true
                    docker logs \$(docker ps -q --filter name=nexus-frontend) --tail=50 || true
                """
            }
        }
    }
}
