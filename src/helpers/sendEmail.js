import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'

const sendEmail = async ({ htmlParams = {}, to = [], subject = '' } = {}) => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  // DEFINE HTML AND TEXT

  const { text, html } = defineHtmlText(htmlParams)

  // SEND EMAIL

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to,
    subject,
    text,
    html
  })

  console.log('RESEND ERROR', error)

  console.log('SENT EMAIL', data)
}

function defineHtmlText (htmlParams) {
  const htmlTemplatePath = path.resolve(
    'src/templates/email-template.html'
  )

  let html = fs.readFileSync(htmlTemplatePath, { encoding: 'utf-8' })

  let text = ''

  const position = html.indexOf('<body>')

  while (
    html.indexOf('[[', position) !== -1 &&
    html.indexOf(']]', position) !== -1
  ) {
    const bracketStart = html.indexOf('[[', position)
    const bracketEnd = html.indexOf(']]', position)

    const sliceStart = html.slice(0, bracketStart)
    const key = html.slice(bracketStart + 2, bracketEnd)
    const sliceEnd = html.slice(bracketEnd + 2)

    html = [sliceStart, htmlParams[key], sliceEnd].join('')

    if (key !== 'HREF') text += `${htmlParams[key]} `
  }

  return { html, text }
}

export default sendEmail
