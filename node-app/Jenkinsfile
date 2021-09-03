def gv

pipeline {
    agent any
    tools {
        nodejs "nodejs"
    }
    stages {
        stage('init'){
            steps {
                script {
                    gv = load "script.groovy"
                }
            }
        }

        stage('cloning-app'){
            steps {
                script {
                    gv.cloneApp()
                }
            }
        }

        stage('building-image'){
            steps {
                script {
                    gv.buildImage()
                }
            }
        }

        stage('deploying'){
            when {
                expression {
                    BRANCH_NAME == 'master'
                }
            }
            steps {
                script {
                    gv.deployApp()
                }
            }
        }
    }
}