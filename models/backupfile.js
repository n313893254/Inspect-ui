import { downloadFile } from '@/utils/download'
import { base64Decode } from '@/utils/crypto'

export default {
  folder() {
    const filePath = this?.filePath || ''

    const out = filePath.replace(`/${this.file || ''}`, '')

    return out
  },

  file() {
    const filePath = this?.filePath || ''
    const backupName = this?.backup?.metadata?.name

    const regexp = new RegExp(`${backupName}-[0-9]/dump.rdb`)
    const exec = regexp.exec(filePath)

    return exec[0]
  },   


  availableActions() {
    const all = [
      {
        action:     'downloadRestore',
        label:      '下载备份',
        icon:       'icon icon-download',
        enabled:    true
      },
    ]

    return all
  },

  downloadRestore() {
    const s3 = this?.backup?.spec?.s3 || {}
    const secret = this?.secret || {}
    const minio  = new AWS.S3({
      accessKeyId:      base64Decode((secret?.data || {})['AWS_ACCESS_KEY_ID']),
      secretAccessKey:  base64Decode((secret?.data || {})['AWS_SECRET_ACCESS_KEY']),
      endpoint:         s3.endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      region:           s3.region,
    })

    const fileName = this.file

    minio.getObject({
      Bucket: s3?.bucket,
      Key:    this.filePath,
    }, function(err, data) {
      if (err) {
        return alert('There was an error' + err.message)
      } else {
        downloadFile(fileName, data.Body, data.ContentType)
      }
    })
  },
}