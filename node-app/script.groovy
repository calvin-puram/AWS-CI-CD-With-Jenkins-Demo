def cloneApp() {
  echo "building the app"
  git([url: 'https://github.com/calvin-puram/nodeapp.git', branch: 'master', credentialsId: 'github'])
}

def buildImage() {
   echo "building the docker image"
   withCredentials([usernamePassword(credentialsId: 'docker-credential', usernameVariable: 'USER', passwordVariable: 'PASS')]){
        sh "cd /var/jenkins_home/workspace/my-multi-pipeline_master"
        sh "docker build -t puram/tour:1.0.0 ."
        sh "echo $PASS | docker login -u $USER --password-stdin"
        sh "docker push puram/tour:1.0.0"
   }
}

def deployApp() {
  sshagent(['ec2-secret-key']) {
    def dockerCmd = "docker run -p 5000:5000 -d -u 0 puram/tour:1.0.0"
    sh "ssh -o StrictHostKeyChecking=no ubuntu@18.116.80.221 ${dockerCmd}"
}
}

return this