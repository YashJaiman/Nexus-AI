pipeline {
agent any

```
environment {
    IMAGE_NAME_BACKEND  = "nexus-ai-backend"
    IMAGE_NAME_FRONTEND = "nexus-ai-frontend"

    GIT_REPO   = "https://github.com/YashJaiman/Nexus-AI.git"
    GIT_BRANCH = "main"

    APP_PORT = "5000"

    BUILD_TAG = "${env.BUILD_NUMBER}"

    // Sonar Scanner Tool Name
    SCANNER_HOME = tool 'Nexus-Sonar'
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
            git branch: GIT_BRANCH,
                url: GIT_REPO

            sh 'ls -lah'
        }
    }

    stage('Environment Check') {
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
                docker compose version || docker-compose --version

                echo "===== WORKSPACE ====="
                pwd
                ls -lah
            '''
        }
    }

    stage('Install Frontend Dependencies') {
        steps {
            sh '''
                npm install

                if grep -q '"lint"' package.json; then
                    npm run lint || true
                fi
            '''
        }
    }

    stage('Install Backend Dependencies') {
        steps {
            sh '''
                cd backend

                npm install

                if grep -q '"test"' package.json; then
                    npm test || true
                fi
            '''
        }
    }

    stage('SonarQube Analysis') {
        steps {
            withSonarQubeEnv('Nexus-Sonar-Server') {
                sh '''
                    ${SCANNER_HOME}/bin/sonar-scanner
                '''
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

    stage('Build Backend Image') {
        steps {
            sh '''
                docker build \
                  -f Dockerfile.backend \
                  -t ${IMAGE_NAME_BACKEND}:${BUILD_TAG} \
                  -t ${IMAGE_NAME_BACKEND}:latest \
                  .
            '''
        }
    }

    stage('Build Frontend Image') {
        steps {
            withCredentials([
                string(credentialsId: 'nexus-ai-gemini-key', variable: 'GEMINI_KEY')
            ]) {
                sh '''
                    docker build \
                      -f Dockerfile.frontend \
                      --build-arg VITE_API_URL=http://3.111.186.12:5000 \
                      --build-arg VITE_GEMINI_API_KEY=${GEMINI_KEY} \
                      -t ${IMAGE_NAME_FRONTEND}:${BUILD_TAG} \
                      -t ${IMAGE_NAME_FRONTEND}:latest \
                      .
                '''
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

                sh '''
                    export MONGO_URI="${MONGO_URI}"
                    export JWT_SECRET="${JWT_SECRET}"
                    export GEMINI_API_KEY="${GEMINI_API_KEY}"

                    export JWT_EXPIRES_IN="7d"

                    export ALLOWED_ORIGINS="http://3.111.186.12:3000"

                    echo "Stopping old containers..."
                    docker compose down || true

                    echo "Starting new containers..."
                    docker compose up -d

                    docker ps
                '''
            }
        }
    }

    stage('Backend Health Check') {
        steps {
            sh '''
                echo "Waiting for backend..."
                sleep 20

                curl -f http://localhost:5000/api/health

                echo "Backend is healthy"
            '''
        }
    }

    stage('Show Running Containers') {
        steps {
            sh '''
                docker ps
            '''
        }
    }

    stage('Cleanup Docker Images') {
        steps {
            sh '''
                docker image prune -f || true
                docker builder prune -f || true
            '''
        }
    }
}

post {

    success {
        echo "=================================="
        echo "Deployment Successful"
        echo "=================================="

        echo "Frontend : http://3.111.186.12:3000"
        echo "Backend  : http://3.111.186.12:5000/api/health"
        echo "SonarQube: http://15.206.124.71:30002"
    }

    failure {
        sh '''
            echo "===== CONTAINER STATUS ====="
            docker ps -a || true

            echo "===== BACKEND LOGS ====="
            docker logs nexus-backend --tail=100 || true

            echo "===== FRONTEND LOGS ====="
            docker logs nexus-frontend --tail=100 || true
        '''
    }

    always {
        cleanWs()
    }
}
```

}
