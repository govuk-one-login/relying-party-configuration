resource "aws_cloudformation_stack" "api_pipeline_stack" {
  name         = "${var.environment}-api-pipeline"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/sam-deploy-pipeline/template.yaml"
  capabilities = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]

  parameters = {
    SAMStackName                            = "${var.environment}-api-deploy"
    Environment                             = var.environment
    VpcStackName                            = "vpc"
    SigningProfileArn                       = var.signing_profile_arn
    SigningProfileVersionArn                = var.signing_profile_version_arn
    AdditionalCodeSigningVersionArns        = var.additional_code_signing_version_arns
    CustomKmsKeyArns                        = var.custom_kms_key_arn
    ArtifactSourceBucketArn                 = var.api_artifact_source_bucket_arn
    ArtifactSourceBucketEventTriggerRoleArn = var.api_artifact_source_bucket_event_trigger_role_arn
    GitHubRepositoryName                    = var.create_build_stacks ? var.repository_name : "none"
    IncludePromotion                        = contains(["build", "staging"], var.environment) ? "Yes" : "No"
    AllowedAccounts                         = join(",", var.allowed_promotion_accounts)
    BuildNotificationStackName              = "build-notifications"
    SlackNotificationType                   = var.environment == "dev" ? "None" : "Failures"
    AllowedServiceOne                       = "DynamoDB"
    ProgrammaticPermissionsBoundary         = "True"
    TestImageRepositoryNames                = contains(["build"], var.environment) ? var.repository_name : ""
    TestImageRepositoryUri                  = contains(["build"], var.environment) ? aws_cloudformation_stack.test_image_repository[0].outputs["TestRunnerImageEcrRepositoryUri"] : "none"
    RunTestContainerInVPC                   = contains(["build"], var.environment) ? "True" : "False"
    ContainerSignerKmsKeyArn                = var.container_signer_kms_key_arn
  }


  depends_on = [aws_cloudformation_stack.vpc_stack, aws_cloudformation_stack.build_notifications_stack]
}
