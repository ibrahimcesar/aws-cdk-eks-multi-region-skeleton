import { Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from "constructs";


export class CicdStack extends Stack {

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const primaryRegion = 'ap-northeast-2';
        const secondaryRegion = 'us-west-2';

    }
}


