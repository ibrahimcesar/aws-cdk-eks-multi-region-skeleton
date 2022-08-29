import { Stack, CfnOutput } from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import {CodeCommitSourceAction,CodeBuildAction, ManualApprovalAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { codeToECRspec, deployToEKSspec } from "../utils/buildspecs";
import { CicdProps } from './cluster-stack';


export class CicdStack extends Stack {

    constructor(scope: Construct, id: string, props: CicdProps) {
      super(scope, id, props);

      const primaryRegion = 'ap-northeast-2';
      const secondaryRegion = 'us-west-2';
      
      const helloRepo = new codecommit.Repository(this, 'hello-demogo', {
        repositoryName: `hello-${Stack.of(this).region}`
      });

      const ecrForMainRegion = new ecr.Repository(this, `ecr-for-hello`);

      const buildForECR = codeToECRspec(
        this,
        ecrForMainRegion.repositoryUri
      );

      ecrForMainRegion.grantPullPush(buildForECR.role!);

      const deployToMainCluster = deployToEKSspec(
        this,
        primaryRegion,
        props.firstRegionCluster,
        ecrForMainRegion,
        props.firstRegionRole
      );

      const deployTo2ndCluster = deployToEKSspec(
        this,
        secondaryRegion,
        props.secondRegionCluster,
        ecrForMainRegion,
        props.secondRegionRole
      );

      const sourceOutput = new codepipeline.Artifact();

      new codepipeline.Pipeline(this, `multi-region-eks-dep`, {
        stages: [
          {
            stageName: 'Source',
            actions: [
              new CodeCommitSourceAction({
                actionName: 'CatchSourceFromCode',
                repository: helloRepo,
                output: sourceOutput
              })
            ]
          },
          {
            stageName: 'Build',
            actions: [
              new CodeBuildAction({
                actionName: 'BuildAndPushToECR',
                input: sourceOutput,
                project: buildForECR
              })
            ]
          },
          {
            stageName: 'DeployToMainEKSCluster',
            actions: [
              new CodeBuildAction({
                actionName: 'DeployToMainEKSCluster',
                input: sourceOutput,
                project: deployToMainCluster
              })
            ]
          },
          {
            stageName: 'ApproveToDeployTo2ndRegion',
            actions: [
              new ManualApprovalAction({
                actionName: 'ApproveToDeployTo2ndRegion'
              })
            ]
          },
          {
            stageName: 'DeployTo2ndRegionCluster',
            actions: [
              new CodeBuildAction({
                actionName: 'DeployTo2ndRegionCluster',
                input: sourceOutput,
                project: deployTo2ndCluster
              })
            ]
          }
        ]
      });

      new CfnOutput(this, `codecommit-uri`, {
        exportName: 'CodeCommitURL',
        value: helloRepo.repositoryCloneUrlHttp
      })

    }

}


