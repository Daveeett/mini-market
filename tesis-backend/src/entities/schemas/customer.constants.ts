import z from 'zod'

const regexPhone = /^\d{10}$/
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const regexText = /^[a-zA-ZÀ-ÿ\s]+$/
const regexNumbers = /^\d+$/

export const createSchema = z.object({
  docType: z.string().min(1).max(2),
  docNumber: z.string().min(1).max(10).regex(regexNumbers, "Solo se permiten números"),
  fullName: z.string().min(2).max(100).regex(regexText, "Solo se permiten letras y espacios"),
  phone: z.string().regex(regexPhone, "Debe contener exactamente 10 números"),
  email: z.union([z.string().regex(regexEmail), z.literal("")]),
  description: z.string().min(1).max(255).optional(),
  maxCredit: z.number().positive("El monto debe ser positivo"),
});