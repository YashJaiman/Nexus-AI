pipeline {
    agent any

    environment {
        IMAGE_NAME_BACKEND  = "nexus-ai-backend"
        IMAGE_NAME_FRONTEND = "nexus-ai-frontend"

        GIT_REPO   = "https://github.com/YashJaiman/Nexus-AI.git"
        GIT_BRANCH = "main"

        BUILD_TAG = "${BUILD_NUMBER}"

        SCANNER_HOME = tool('Nexus-Sonar')
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

        stage('Clone Repository') {
            steps {
                git branch: GIT_BRANCH, url: GIT_REPO

                sh '''
                    echo "===== REPOSITORY CLONED ====="
                    pwd
                    ls -lah
                '''
            }
        }

        stage('Debug Environment') {
            steps {
                sh '''
                    echo "===== MEMORY ====="
                    free -h

                    echo "===== DISK ====="
                    df -h

                    echo "===== NODE ====="
                    node -v
                    npm -v

                    echo "===== DOCKER ====="
                    docker --version

                    echo "===== DOCKER COMPOSE ====="
                    docker compose version || docker-compose version

                    echo "===== WORKSPACE ====="
                    pwd
                    ls -lah
                '''
            }
        }

        stage('Frontend Install & Lint') {
            steps {
                sh '''
                    npm install

                    if grep -q '"lint"' package.json; then
                        npm run lint || true
                    else
                        echo "No lint script found"
                    fi
                '''
            }
        }

        stage('Backend Install & Test') {
            steps {
                dir('backend') {
                    sh '''
                        npm install

                        if grep -q '"test"' package.json; then
                            npm test || true
                        else
                            echo "No test script found"
                        fi
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('Nexus-Sonar-Server') {

                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=nexus-ai \
                        -Dsonar.projectName=nexus-ai \
                        -Dsonar.projectVersion=${BUILD_TAG}
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            steps {

                withCredentials([
                    string(credentialsId: 'nexus-ai-gemini-key', variable: 'GEMINI_KEY')
                ]) {

                    sh """
                        echo "===== BUILDING BACKEND IMAGE ====="

                        docker build \
                          -f Dockerfile.backend \
                          -t ${IMAGE_NAME_BACKEND}:${BUILD_TAG} \
                          -t ${IMAGE_NAME_BACKEND}:latest \
                          .

                        echo "===== BUILDING FRONTEND IMAGE ====="

                        docker build \
                          -f Dockerfile.frontend \
                          --build-arg VITE_API_URL=http://13.232.9.58:5000 \
                          --build-arg VITE_GEMINI_API_KEY=${GEMINI_KEY} \
                          -t ${IMAGE_NAME_FRONTEND}:${BUILD_TAG} \
                          -t ${IMAGE_NAME_FRONTEND}:latest \
                          .

                        echo "===== BUILT IMAGES ====="

                        docker images | grep nexus-ai || true
                    """
                }
            }
        }

        stage('Deploy Application') {
            steps {

                withCredentials([
                    string(credentialsId: 'nexus-ai-mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'nexus-ai-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'nexus-ai-gemini-key', variable: 'GEMINI_API_KEY')
                ]) {

                    sh """
                        export MONGO_URI="${MONGO_URI}"
                        export JWT_SECRET="${JWT_SECRET}"
                        export GEMINI_API_KEY="${GEMINI_API_KEY}"

                        export JWT_EXPIRES_IN="7d"
                        export ALLOWED_ORIGINS="http://13.232.9.58:3000"

                        echo "===== STOPPING OLD CONTAINERS ====="
                        docker compose down || true

                        echo "===== STARTING NEW CONTAINERS ====="
                        docker compose up -d

                        echo "===== RUNNING CONTAINERS ====="
                        docker ps
                    """
                }
            }
        }

        stage('Backend Health Check') {
            steps {
                sh '''
                    echo "Waiting for backend startup..."
                    sleep 30

                    curl -f http://localhost:5000/api/health

                    echo "Backend is healthy"
                '''
            }
        }

        stage('Show Running Containers') {
            steps {
                sh '''
                    echo "===== CONTAINERS ====="
                    docker ps
                '''
            }
        }

        stage('Cleanup Old Images') {
            steps {
                sh '''
                    docker image prune -f || true
                    docker builder prune -f || true
                '''
            }
        }
    }

    post {

        always {
            cleanWs()
        }

        success {

            echo "========================================="
            echo "DEPLOYMENT SUCCESSFUL"
            echo "========================================="
            echo "Frontend  : http://13.232.9.58:3000"
            echo "Backend   : http://13.232.9.58:5000/api/health"
            echo "SonarQube : http://13.201.11.78:30002"
            echo "========================================="
        }

        failure {

            sh '''
                echo "===== BACKEND LOGS ====="
                docker logs nexus-backend --tail=100 || true

                echo "===== FRONTEND LOGS ====="
                docker logs nexus-frontend --tail=100 || true

                echo "===== ALL CONTAINERS ====="
                docker ps -a || true
            '''
        }
    }
}
