def buildJar() {
  echo "building the app"
  sh "mvn package"
}

def buildImage() {
   echo "building the docker image"
   withCredentials([usernamePassword(credentialsId: 'docker-credential', usernameVariable: 'USER', passwordVariable: 'PASS')]){
        sh "docker build -t puram/java_app:1.0.0 ."
        sh "echo $PASS | docker login -u $USER --password-stdin"
        sh "docker push puram/java_app:1.0.0"
   }
}

def deployApp() {
  echo "deploying the application"
}

return this