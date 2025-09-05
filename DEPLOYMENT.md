# GitHub Actions Multi-Environment Deployment Guide

This project uses GitHub Actions for automated deployment to AWS S3 and CloudFront with separate staging and production environments, replacing the previous CodePipeline setup.

## Environment Setup

### Staging Environment
- **Branch**: `develop`
- **Build Config**: `staging`
- **Purpose**: Testing and preview of new features

### Production Environment
- **Branch**: `master`
- **Build Config**: `production`
- **Purpose**: Live production deployment

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your GitHub repository:

### 1. AWS Credentials (Shared)
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key

### 2. Staging Environment Resources
- `S3_BUCKET_NAME_STAGING` - The name of your staging S3 bucket (`wowkeyb-staging`)
- `CLOUDFRONT_DISTRIBUTION_ID_STAGING` - The staging CloudFront distribution ID (`E9VUEP9RT5Q3M`)

### 3. Production Environment Resources
- `S3_BUCKET_NAME_PROD` - The name of your production S3 bucket (`wowkeyb-production`)
- `CLOUDFRONT_DISTRIBUTION_ID_PROD` - The production CloudFront distribution ID (`E3FA3CXEIQEBUK`)

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact names listed above

## Deployment Triggers

The workflow will automatically run when:
- Code is pushed to the `master` branch → **Production deployment**
- Code is pushed to the `develop` branch → **Staging deployment**
- Manually triggered via the GitHub Actions tab with environment selection

## Build Configurations

### Staging Build (`develop` branch)
- Uses `staging` configuration
- Optimized for testing with staging environment variables
- Enables output hashing for cache busting
- Uses staging environment file

### Production Build (`master` branch)
- Uses `production` configuration
- Fully optimized for production
- Enables output hashing for cache busting
- Uses production environment file
- Applies production budgets for bundle size

## Build Output

The Angular build outputs to `dist/fuse/` directory, which is then synced to the appropriate S3 bucket based on the environment.

## CloudFront Distribution URLs

### Staging Environment
- **CloudFront URL**: `https://d1epgrrdit2v00.cloudfront.net`
- **S3 Website URL**: `http://wowkeyb-staging.s3-website-us-east-1.amazonaws.com`
- **Distribution ID**: `E9VUEP9RT5Q3M`

### Production Environment
- **CloudFront URL**: `https://d2e16vwymso8fj.cloudfront.net`
- **S3 Website URL**: `http://wowkeyb-production.s3-website-us-east-1.amazonaws.com`
- **Distribution ID**: `E3FA3CXEIQEBUK`

**Note**: CloudFront distributions may take 10-15 minutes to fully deploy and become available.

## Cache Strategy

- **Static assets** (JS, CSS, images): Cached for 1 year with immutable flag
- **HTML and JSON files**: Cached for 0 seconds with 1 year CDN cache

## CloudFront Invalidation

After deployment, all CloudFront paths (`/*`) are invalidated for the appropriate environment to ensure users get the latest content.

## Workflow Features

### Automatic Environment Detection
- The workflow automatically detects the environment based on the branch
- `master` → Production
- `develop` → Staging

### Manual Deployment
You can trigger a manual deployment by:
1. Going to the **Actions** tab in your GitHub repository
2. Selecting the **Deploy to AWS** workflow
3. Clicking **Run workflow**
4. Choosing the environment (staging or production)

### Environment-Specific Logging
- Clear logging shows which environment is being deployed
- Displays the S3 bucket and CloudFront distribution being used

## Migration from CodePipeline

This GitHub Actions workflow replaces your previous CodePipeline setup. You can now:

1. Remove the CodePipeline configuration from AWS
2. Delete the `buildspec.yml` file (if no longer needed)
3. Use this GitHub Actions workflow for all deployments
4. Deploy to staging for testing before production

## Testing

The workflow includes automated testing with Karma and Chrome Headless before deployment. Tests must pass for the deployment to proceed.

## Recommended Workflow

1. **Development**: Work on feature branches
2. **Staging**: Merge to `develop` branch for staging deployment
3. **Production**: Merge `develop` to `master` for production deployment

This ensures proper testing in staging before production releases.
