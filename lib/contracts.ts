import PDFDocument from 'pdfkit'

export async function generateContractPdf(reservation: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: any[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      doc.fontSize(18).text('Bon de réservation', { align: 'center' })
      doc.moveDown()

      doc.fontSize(12).text(`Réservation #${reservation.id || ''}`)
      doc.text(`Nom : ${reservation.full_name || ''}`)
      doc.text(`E-mail : ${reservation.email || ''}`)
      doc.text(`Chien : ${reservation.dog_name || ''}`)
      doc.moveDown()

      doc.text('Conditions de réservation :', { underline: true })
      doc.fontSize(10).text('Le versement de l’acompte confirme la réservation du chiot. En cas de désistement non justifié, l’acompte est non remboursable. La cession finale intervient après validation vétérinaire et administratif.')

      doc.end()
    } catch (e) {
      reject(e)
    }
  })
}
