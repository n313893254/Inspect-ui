import JSZip from 'jszip'

export async function downloadFile(fileName, content, contentType = 'text/plain;charset=utf-8') {
  let blob

  if (content?.byteLength) {
    blob = new Blob([content.buffer], { type: contentType })
  } else {
    blob = new Blob([content], { type: contentType })
  }

  const { saveAs } = await import('file-saver')

  return saveAs(blob, fileName)
}

// {[fileName1]:data1, [fileName2]:data2}
export function generateZip(files) {
  // Moving this to a dynamic const JSZip = import('jszip') didn't work... figure out later
  const zip = new JSZip()

  for ( const fileName in files) {
    zip.file(fileName, files[fileName])
  }
  console.log(zip, 'zip')
  return zip.generateAsync({ type: 'blob' }).then((contents) => {
    return contents
  })
}
