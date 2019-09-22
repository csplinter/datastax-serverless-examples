# Prerequisites Setup
## Cassandra REST API with AWS Lambda in Node.js

In this example we will manually set up a DataStax Distribution of Apache Cassandra instance in AWS EC2, the same could also be done with Apache Cassandra or DataStax Enterprise.

### Launch an instance in AWS EC2

1. To get things started, log into the AWS Console, if you do not have an account, create one. https://aws.amazon.com/console/
2. After logging in, click on the "Services" dropdown in the top left and click on "EC2".
3. In the EC2 dashboard, you should see a big blue button that says "Launch Instance", click that.
4. Next you are prompted to select an AMI, choose "Ubuntu Server 18.04 LTS (HVM), SSD Volume Type".
5. Next is to select the instance type, choose t2.micro ( it's Free Tier eligable ) and then click on "6: Configure Security Groups" in the top menu, as we will use the defaults for everything else.
6. On this page, restrict SSH access to your own IP, and then create a Custom TCP Rule allowing traffic on the C* CQL port 9042 to Anywhere. Once this is done, click the "Review and Launch" button in the bottom right. **Note: This is simply for example purposes and this security setting should never be deployed for any real use cases**.
7. Review your configuration and then click "Launch" in the bottom right which will take you to the key pair dialogue.
8. On the key pair dialogue, select an existing key pair or create a new one and then make sure that you save that in a secure, known location as it will be needed to ssh to the instance.
9. After that, you should see that the instance is launching, click on the id of your instance to go to its dashboard and copy the Public IP of the instance.

### Start the database
Now that we have an instance running in AWS EC2, we will install and start DDAC on that instance.

1. To SSH to your instance in AWS EC2, you will need the key pair that was downloaded in Step 8 above and the Public IP.
```
ssh -i <path-to-keypair.pem> ubuntu@<public-ip>
```
2. Install Java 8
```
sudo apt-get update 
sudo apt-get install -y openjdk-8-jdk-headless
```
3. Install DDAC ( by installing you agree to the [terms of use](https://www.datastax.com/legal/datastax-distribution-apache-cassandra-ddac-terms) )
```
mkdir ddac; wget -c https://downloads.datastax.com/ddac/ddac-bin.tar.gz -O - | tar -xz -C ddac --strip-components=1
```
4. Set `broadcast_rpc_address` to the Public IP ( needed for client connections )
```
sed -i 's/# broadcast_rpc_address:.*/broadcast_rpc_address: <public-ip>/' ddac/conf/cassandra.yaml
```
5. Set `rpc_address` to listen on 0.0.0.0
```
sed -i 's/^rpc_address:.*/rpc_address: 0.0.0.0/' ddac/conf/cassandra.yaml
```
6. Start the database
```
ddac/bin/cassandra
```
7. Grab the data center name from the last line of output from the startup process, in the following example it is "datacenter1". You will need to set this as the `LOCAL_DC` value in serverless.yml
```
INFO  [main] 2019-09-22 16:38:48,833 StorageService.java:722 - Snitch information: DynamicEndpointSnitch{registered=true, subsnitch=SimpleSnitch{, DC='datacenter1', rack='rack1'}}, local DC:datacenter1 / rack:rack1
```

### Set up local development environment
1. Install Node.js and NPM: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
2. Install Serverless
```
npm install -g serverless
```
3. Follow the instructions for setting up serverless with your AWS Credentials https://serverless.com/framework/docs/providers/aws/guide/credentials/


Hope that wasn't too difficult and you are still here, if so now head on over to the main [README](README.md) to run this example.


