import * as iam from 'aws-cdk-lib/aws-iam';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Cluster, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { PhysicalName } from 'aws-cdk-lib';
import { Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from "constructs";

export class ClusterStack extends Stack {
  public readonly cluster: Cluster;
  public readonly firstRegionRole: Role;
  public readonly secondRegionRole: Role;

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
      defaultCapacity: 2,
      defaultCapacityInstance: Stack.of(this).region == primaryRegion
        ? new InstanceType('r5.2xlarge')
        : new InstanceType('m5.2xlarge')
    });

    cluster.addAutoScalingGroupCapacity('spot-group', {
      instanceType: new InstanceType('m5.xlarge'),
      spotPrice: Stack.of(this).region === primaryRegion ? '0.248': '0.192'
    });

    if (Stack.of(this).region === primaryRegion) {
      this.firstRegionRole = createDeployRole(this, `for-1st-region`, cluster)
    } else {
      this.secondRegionRole = createDeployRole(this, `for-2nd-region`, cluster)
    }

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

export interface EksProps extends StackProps {
  cluster: Cluster
}

export interface CicdProps extends StackProps {
  firstRegionCluster: Cluster,
  secondRegionCluster: Cluster,
  firstRegionRole: Role,
  secondRegionRole: Role
}