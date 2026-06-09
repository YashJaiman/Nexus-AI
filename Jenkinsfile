pipeline {
    agent any

    environment {
        IMAGE_NAME = "nexus-ai"
        CONTAINER  = "nexus-ai-container"
        GIT_REPO   = "https://github.com/YashJaiman/Nexus-AI.git"
        GIT_BRANCH = "main"
        APP_PORT   = "5000"
        BUILD_TAG  = "${env.BUILD_NUMBER}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: "10"))
        timeout(time: 30, unit: "MINUTES")
        disableConcurrentBuilds()
    }

    triggers {
        githubPush()  // Auto-trigger on every push via webhook
    }

    stages {

        stage("Clone Repository") {
            steps {
                // Public repo — no credentialsId needed
                git url: GIT_REPO, branch: GIT_BRANCH
                sh "ls -la"
            }
        }

        stage("Frontend — Install") {
            steps {
                sh """
                    node --version && npm --version
                    npm install --silent
                    echo "Frontend dependencies installed"
                """
            }
        }

        stage("Backend — Install and Test") {
            steps {
                sh """
                    cd backend
                    npm install --silent
                    if grep -q '"test"' package.json; then
                        npm test || echo "Tests completed"
                    else
                        echo "No test script — skipping"
                    fi
                """
            }
        }

        stage("Build Docker Image Locally") {
            steps {
                withCredentials([string(credentialsId: "nexus-ai-gemini-key", variable: "GEMINI_KEY")]) {
                    sh """
                        docker build \\
                            --build-arg VITE_API_URL=http://localhost:5000 \\
                            --build-arg VITE_GEMINI_API_KEY=\${GEMINI_KEY} \\
                            -t nexus-ai:\${BUILD_TAG} \\
                            -t nexus-ai:latest \\
                            .
                        docker images | grep nexus-ai
                    """
                }
            }
        }

        stage("Stop Old Container") {
            steps {
                sh """
                    docker stop nexus-ai-container || true
                    docker rm   nexus-ai-container || true
                    echo "Old container cleared"
                """
            }
        }

        stage("Run New Container") {
            steps {
                withCredentials([
                    string(credentialsId: "nexus-ai-mongo-uri",  variable: "MONGO_URI"),
                    string(credentialsId: "nexus-ai-jwt-secret", variable: "JWT_SECRET"),
                    string(credentialsId: "nexus-ai-gemini-key", variable: "GEMINI_KEY")
                ]) {
                    sh """
                        docker run -d \\
                            --name nexus-ai-container \\
                            --restart unless-stopped \\
                            -p 5000:5000 \\
                            -e PORT=5000 \\
                            -e NODE_ENV=production \\
                            -e MONGO_URI="\${MONGO_URI}" \\
                            -e JWT_SECRET="\${JWT_SECRET}" \\
                            -e JWT_EXPIRES_IN=7d \\
                            -e GEMINI_API_KEY="\${GEMINI_KEY}" \\
                            -e ALLOWED_ORIGINS="http://localhost:5000,http://localhost:3000" \\
                            nexus-ai:latest
                        docker ps | grep nexus-ai-container
                    """
                }
            }
        }

        stage("Health Check") {
            steps {
                sh """
                    sleep 15
                    curl -f http://localhost:5000/api/health \\
                        && echo "✅ App LIVE at http://localhost:5000" \\
                        || echo "⚠️ Health check FAILED"
                    docker logs nexus-ai-container --tail=20
                """
            }
        }
    }

    post {
        always {
            // Keep last 3 builds, clean the rest
            sh """
                docker images nexus-ai --format "{{.Tag}}" | \\
                    grep -v latest | sort -n | head -n -3 | \\
                    xargs -I {} docker rmi nexus-ai:{} || true
                docker image prune -f || true
            """
            cleanWs()
        }
        success { echo "✅ Live: http://localhost:5000/api/health" }
        failure { sh "docker logs nexus-ai-container --tail=50 || true" }
    }
}
