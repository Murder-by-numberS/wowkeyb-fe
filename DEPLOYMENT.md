# GitHub Actions Multi-Environment Deployment Guide

This project uses GitHub Actions for automated deployment to AWS S3 and CloudFront with separate develop, staging, and production environments, replacing the previous CodePipeline setup.

## Environment Setup

### Develop Environment
- **Branch**: `develop`
- **Build Config**: `develop`
- **Purpose**: Development and testing of new features

### Staging Environment
- **Branch**: `staging`
- **Build Config**: `staging`
- **Purpose**: Pre-production testing and validation

### Production Environment
- **Branch**: `master`
- **Build Config**: `production`
- **Purpose**: Live production deployment

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your GitHub repository:

### 1. AWS Credentials (Shared)
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key

### 2. Develop Environment Resources
- `S3_BUCKET_NAME_DEVELOP` - The name of your develop S3 bucket (`wowkeyb-develop`)
- `CLOUDFRONT_DISTRIBUTION_ID_DEVELOP` - The develop CloudFront distribution ID (`E2QBAYP1I5UG5T`)

### 3. Staging Environment Resources
- `S3_BUCKET_NAME_STAGING` - The name of your staging S3 bucket (`wowkeyb-staging`)
- `CLOUDFRONT_DISTRIBUTION_ID_STAGING` - The staging CloudFront distribution ID (`E9VUEP9RT5Q3M`)

### 4. Production Environment Resources
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
- Code is pushed to the `develop` branch → **Develop deployment**
- Code is pushed to the `staging` branch → **Staging deployment**
- Manually triggered via the GitHub Actions tab with environment selection

## Build Configurations

### Develop Build (`develop` branch)
- Uses `develop` configuration
- Optimized for development with develop environment variables
- Enables output hashing for cache busting
- Uses develop environment file

### Staging Build (`staging` branch)
- Uses `staging` configuration
- Optimized for pre-production testing with staging environment variables
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

### Develop Environment
- **CloudFront URL**: `https://d1fr0oji1jx8rx.cloudfront.net`
- **Custom Domain**: `https://develop.wowkeyb.gg`
- **S3 Website URL**: `http://wowkeyb-develop.s3-website-us-east-1.amazonaws.com`
- **Distribution ID**: `E2QBAYP1I5UG5T`

### Staging Environment
- **CloudFront URL**: `https://d1epgrrdit2v00.cloudfront.net`
- **Custom Domain**: `https://staging.wowkeyb.gg`
- **S3 Website URL**: `http://wowkeyb-staging.s3-website-us-east-1.amazonaws.com`
- **Distribution ID**: `E9VUEP9RT5Q3M`

### Production Environment
- **CloudFront URL**: `https://d2e16vwymso8fj.cloudfront.net`
- **Custom Domain**: `https://wowkeyb.gg`
- **WWW Domain**: `https://www.wowkeyb.gg`
- **S3 Website URL**: `http://wowkeyb-production.s3-website-us-east-1.amazonaws.com`
- **Distribution ID**: `E3FA3CXEIQEBUK`

**Note**: CloudFront distributions may take 10-15 minutes to fully deploy and become available.

## Cache Strategy

- **Static assets** (JS, CSS, images): Cached for 1 year with immutable flag
- **HTML and JSON files**: Cached for 0 seconds with 1 year CDN cache

## CloudFront Invalidation

After deployment, all CloudFront paths (`/*`) are invalidated for the appropriate environment to ensure users get the latest content.

## Custom Domain Setup

### DNS Records Configuration

Configure the following CNAME records in your DNS provider for the `wowkeyb.gg` domain:

#### Production Environment
- **Name**: `@` (root domain)
- **Type**: `CNAME`
- **Value**: `d2e16vwymso8fj.cloudfront.net`
- **TTL**: 300

- **Name**: `www`
- **Type**: `CNAME`
- **Value**: `d2e16vwymso8fj.cloudfront.net`
- **TTL**: 300

#### Develop Environment
- **Name**: `develop`
- **Type**: `CNAME`
- **Value**: `d1fr0oji1jx8rx.cloudfront.net`
- **TTL**: 300

#### Staging Environment
- **Name**: `staging`
- **Type**: `CNAME`
- **Value**: `d1epgrrdit2v00.cloudfront.net`
- **TTL**: 300

### CloudFront Configuration

Update each CloudFront distribution to accept the custom domains:

#### Production Distribution (ID: `E3FA3CXEIQEBUK`)
- Add `wowkeyb.gg` and `www.wowkeyb.gg` to "Alternate Domain Names (CNAMEs)"

#### Develop Distribution (ID: `E2QBAYP1I5UG5T`)
- Add `develop.wowkeyb.gg` to "Alternate Domain Names (CNAMEs)"

#### Staging Distribution (ID: `E9VUEP9RT5Q3M`)
- Add `staging.wowkeyb.gg` to "Alternate Domain Names (CNAMEs)"

### SSL Certificates

CloudFront will automatically provision SSL certificates for all custom domains. This process may take 15-20 minutes to complete.

### Access URLs

Once configured, the environments will be accessible at:
- **Production**: `https://wowkeyb.gg` and `https://www.wowkeyb.gg`
- **Develop**: `https://develop.wowkeyb.gg`
- **Staging**: `https://staging.wowkeyb.gg`

## Workflow Features

### Automatic Environment Detection
- The workflow automatically detects the environment based on the branch
- `master` → Production
- `develop` → Develop
- `staging` → Staging

### Manual Deployment
You can trigger a manual deployment by:
1. Going to the **Actions** tab in your GitHub repository
2. Selecting the **Deploy to AWS** workflow
3. Clicking **Run workflow**
4. Choosing the environment (develop, staging, or production)

### Environment-Specific Logging
- Clear logging shows which environment is being deployed
- Displays the S3 bucket and CloudFront distribution being used

## Migration from CodePipeline

This GitHub Actions workflow replaces your previous CodePipeline setup. You can now:

1. Remove the CodePipeline configuration from AWS
2. Delete the `buildspec.yml` file (if no longer needed)
3. Use this GitHub Actions workflow for all deployments
4. Deploy to develop and staging for testing before production

## Testing

The workflow includes automated testing with Karma and Chrome Headless before deployment. Tests must pass for the deployment to proceed.

## Recommended Workflow

1. **Development**: Work on feature branches
2. **Develop**: Merge to `develop` branch for develop deployment
3. **Staging**: Merge `develop` to `staging` branch for staging deployment
4. **Production**: Merge `staging` to `master` for production deployment

This ensures proper testing in develop and staging before production releases.
