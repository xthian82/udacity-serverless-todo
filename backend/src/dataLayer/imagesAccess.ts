
const AWS = require('aws-sdk')

export class ImagesAccess {

    constructor(
        private readonly s3BucketName = process.env.IMAGES_S3_BUCKET,
        private readonly signedUrlexpiration = parseInt(process.env.SIGNED_URL_EXPIRATION),
        private readonly s3Client = createS3Client()) {
    }


    getUploadUrl(imageName: string): string {
        return `https://${this.s3BucketName}.s3.amazonaws.com/${imageName}`
    }

    generateSignedUploadUrl(imageName: string): string {
        return this.s3Client.getSignedUrl('putObject', {
            Bucket: this.s3BucketName,
            Key: `${imageName}`,
            Expires: this.signedUrlexpiration
        }) as string
    }
}

function createS3Client() {
    return new AWS.S3({
        signatureVersion: 'v4' // Use Sigv4 algorithm
    })
}
