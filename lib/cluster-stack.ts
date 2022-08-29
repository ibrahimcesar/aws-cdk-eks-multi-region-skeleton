import * as iam from 'aws-cdk-lib/aws-iam';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Cluster, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { PhysicalName } from 'aws-cdk-lib';
import { Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from "constructs";

export class ClusterStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const primaryRegion = 'us-west-1';
    const clusterAdmin = new Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    const cluster = new Cluster(this, 'demogo-cluster', {
      clusterName: "demogo",
      mastersRole: clusterAdmin,
      version: KubernetesVersion.V1_21,
      defaultCapacity: 2
    });

    cluster.addAutoScalingGroupCapacity('spot-group', {
      instanceType: new InstanceType('m5.xlarge'),
      spotPrice: Stack.of(this).region === primaryRegion ? '0.248': '0.192';
    });

  }
}

function createDeployRole(scope: Construct, id: string, cluster: Cluster): Role {
  const role = new Role(scope, id, {
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    assumedBy: new iam.AccountRootPrincipal()
  });
  
  cluster.awsAuth.addMastersRole(role);

  return role;
}
