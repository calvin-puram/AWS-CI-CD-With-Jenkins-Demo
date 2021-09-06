def cloneApp() {
  echo "building the app"
  git([url: 'https://github.com/calvin-puram/docker-prod.git', branch: 'master', credentialsId: 'github'])
}

def buildImage(image) {
   echo "building the docker image"
   withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'USER', passwordVariable: 'PASS')]){
        def dir = "/var/jenkins_home/workspace/docker-prod_master/backend/"
        sh "docker build -t ${image}  ${dir}"
        sh "echo $PASS | docker login -u $USER --password-stdin"
        sh "docker push ${image}"
   }
}

def deployApp(image) {
  sshagent(['ec2-secret-key']) {
    def serverCmd = "bash backend/server.sh ${image}"
    def serverIP = "ubuntu@3.134.95.189"
    sh "scp -o StrictHostKeyChecking=no ./server.sh ${serverIP}:/home/ubuntu/backend"
    sh "scp -o StrictHostKeyChecking=no docker-compose-prod.yml ${serverIP}:/home/ubuntu"
    sh "ssh -o StrictHostKeyChecking=no ${serverIP} ${serverCmd}"
}
}



return this
