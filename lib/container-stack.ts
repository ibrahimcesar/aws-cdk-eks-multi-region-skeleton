import { Stack } from 'aws-cdk-lib';
import { EksProps } from "./cluster-stack";
import { Construct } from "constructs";
import { readYamlFromDir } from '../utils/read-file';

export class ContainerStack extends Stack {
  constructor(scope: Construct, id: string, props: EksProps) {
    super(scope, id, props);

    const cluster = props.cluster;
    const commonFolder = './yaml-common/';
    const regionFolder = `./yaml-${Stack.of(this).region}/`;

    readYamlFromDir(commonFolder, cluster);
    readYamlFromDir(regionFolder, cluster);

  }
}


