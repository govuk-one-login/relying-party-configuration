variable "environment" {
  type        = string
  description = "The environment name"
  validation {
    condition     = contains(["dev", "build", "staging", "integration", "production"], var.environment)
    error_message = "Valid values for var: environment are (dev, build, staging, integration, production)"
  }
}

variable "create_build_stacks" {
  type        = bool
  description = "Whether or not to deploy the stacks for building and signing application code. Only needed in dev and build. Defaults to false"
  default     = false
}

variable "system" {
  type        = string
  description = "The name of the system. Used in tags."
  default     = "RP Configuration"
}

variable "product" {
  type        = string
  description = "The name of the product. Used in tags."
  default     = "GOV.UK One Login"
}

variable "owner_email" {
  type        = string
  description = "The owning team's Google Group email address. Used for tagging and ECR scan notifications"
  default     = "di-orchestration@digital.cabinet-office.gov.uk"
}

variable "signer_allowed_accounts" {
  type        = list(string)
  description = "The AWS account IDs that can read the code signing KMS key"
}
variable "signing_profile_arn" {
  type        = string
  description = "The ARN of the signing profile used to sign Lambda code. This is the shared profile deployed in build from the signer stack"
}
variable "signing_profile_version_arn" {
  type        = string
  description = "The ARN of the signing profile version used to sign Lambda code. This is the shared profile deployed in build from the signer stack"
}
variable "api_artifact_source_bucket_arn" {
  type        = string
  description = "The ARN of the promotion bucket from the previous environment's API pipeline"
  default     = "none"
}

variable "api_artifact_source_bucket_event_trigger_role_arn" {
  type        = string
  description = "The ARN of the role to assume for promotion events from the previous environment's API pipeline"
  default     = "none"
}
variable "repository_name" {
  type        = string
  description = "The Github repository name"
  default     = "relying-party-configuration"
}

variable "allowed_promotion_accounts" {
  type        = list(string)
  description = "The AWS account IDs that this pipeline will promote to. Maximum 2 accounts"
  default     = []
}
variable "container_signer_kms_key_arn" {
  type        = string
  description = "The ARN of the KMS key that signs test container images"
  default     = "none"
}
variable "additional_code_signing_version_arns" {
  type        = string
  description = "The ARN of an additional signing profile version used to sign Lambda code"
  default     = "arn:aws:signer:eu-west-2:216552277552:/signing-profiles/DynatraceSigner/5uwzCCGTPq"
}

variable "custom_kms_key_arn" {
  type        = string
  description = "The ARN of a custom KMS key that can be used to access secrets"
  default     = "arn:aws:kms:eu-west-2:216552277552:key/4bc58ab5-c9bb-4702-a2c3-5d339604a8fe"
}
