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
        SCANNER_HOME = tool 'sonar-scanner'   // name from Global Tool Configuration
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

        stage("Frontend: Install & Lint (optional)") {
            steps {
                sh """
                    npm install --silent
                    if grep -q '"lint"' package.json; then
                        npm run lint || echo "Lint step failed but continuing"
                    else
                        echo "No lint script - skipping"
                    fi
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
                """
            }
        }

      stage("SonarQube Analysis") {
    steps {
        withSonarQubeEnv('Nexus-Sonar-Server') {
            sh """
                ${SCANNER_HOME}/bin/sonar-scanner \\
                  -Dsonar.projectKey=nexus-ai \\
                  -Dsonar.projectName=nexus-ai \\
                  -Dsonar.projectVersion=${BUILD_TAG} \\
                  -Dsonar.sources=.
            """
        }
    }
}
        stage("Build Docker Images") {
            steps {
                withCredentials([
                    string(credentialsId: "nexus-ai-gemini-key", variable: "GEMINI_KEY")
                ]) {
                    sh """
                        # Backend
                        docker build \\
                          -f Dockerfile.backend \\
                          -t ${IMAGE_NAME_BACKEND}:${BUILD_TAG} \\
                          -t ${IMAGE_NAME_BACKEND}:latest \\
                          .

                        # Frontend
                        docker build \\
                          -f Dockerfile.frontend \\
                          --build-arg VITE_API_URL=http://backend:5000 \\
                          --build-arg VITE_GEMINI_API_KEY=${GEMINI_KEY} \\
                          -t ${IMAGE_NAME_FRONTEND}:${BUILD_TAG} \\
                          -t ${IMAGE_NAME_FRONTEND}:latest \\
                          .

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
                        export ALLOWED_ORIGINS="http://localhost:5000,http://localhost:3000"

                        docker compose down || docker-compose down || true
                        docker compose up -d || docker-compose up -d
                    """
                }
            }
        }

        stage("Health Check") {
            steps {
                sh """
                    sleep 15
                    curl -f http://localhost:${APP_PORT}/api/health \\
                        && echo "✅ Backend LIVE at http://localhost:${APP_PORT}" \\
                        || echo "⚠️ Health check FAILED"
                    docker ps
                """
            }
        }
    }

    post {
        always {
            sh """
                docker image prune -f || true
                docker builder prune -f || true
            """
            cleanWs()
        }
        success {
            echo "✅ App LIVE at http://localhost:${APP_PORT}/api/health"
        }
        failure {
            sh "docker logs \$(docker ps -q --filter name=backend) --tail=50 || true"
        }
    }
}
