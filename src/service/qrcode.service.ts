// service/qrcode.service.ts
import QRCode from 'qrcode'
import cloudinary from 'cloudinary'
import mongoose from 'mongoose'
import { findAndUpdateTable } from './table.service'
// import { findAndUpdateStore, findStore } from './business.service'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
})

export const generateAndUploadQRCode = async (tableId: string, data: {tableUrl: string}) => {
  try {
    console.log('generateAndUploadQRCode received storeId:', tableId, 'type:', typeof tableId)

    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      throw new Error('Invalid tableId passed to QR generator: ' + tableId)
    }
    const objectId = new mongoose.Types.ObjectId(tableId)

    // generate QR
    const qrDataUrl = await QRCode.toDataURL(data.tableUrl, {
        width: 1000,     // higher resolution
        margin: 0,       // no border
        scale: 10,       // further increases pixel density
        errorCorrectionLevel: 'H', // best for logo overlays
    })
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')

    // upload to Cloudinary
    const uploadResponse = await cloudinary.v2.uploader.upload(`data:image/png;base64,${base64Data}`, {
      folder: 'scanserve-assets/qr-codes',
      public_id: `qr-${Date.now()}-${tableId}`,
      overwrite: true,
      resource_type: 'image'
    })

    // update store
    const updatedStore = await findAndUpdateTable(
      { _id: objectId },
      {
        storeFront: {
            tableUrl: data.tableUrl,
            tableQrCOde: uploadResponse.secure_url
        }
      },
      { new: true }
    )

    if (!updatedStore || (updatedStore as any).error) {
      console.error('findAndUpdateStore returned null or error for id:', tableId)
      throw new Error('Store not found or error when updating QR code (id: ' + tableId + ')')
    }

    // Only log _id if it exists
    if ((updatedStore as any)._id) {
      console.log('store updated OK:', (updatedStore as any)._id)
    } else {
      console.log('store updated OK, but _id not present:', updatedStore)
    }
    return uploadResponse.secure_url
  } catch (err) {
    console.error('QR code upload failed:', err)
    throw err
  }
}
