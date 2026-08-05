import { LetterModel, PetModel } from "../models/index.js";

// Kode prefix nomor surat per jenis
const TYPE_PREFIX: Record<string, string> = {
  surgery: "SPO",
  anesthesia: "SPB",
  inpatient: "SPRI",
  referral: "SR",
  boarding: "SPPH",
  euthanasia: "SPE",
};

export async function listLetters(filter: { page?: number; limit?: number; letterType?: string; search?: string }) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 10;
  const query: any = {};
  if (filter.letterType) query.letterType = filter.letterType;
  if (filter.search) {
    query.$or = [
      { letterNumber: { $regex: filter.search, $options: "i" } },
      { subject: { $regex: filter.search, $options: "i" } },
      { ownerSignedName: { $regex: filter.search, $options: "i" } },
    ];
  }
  const total = await LetterModel.countDocuments(query);
  const data = await LetterModel.find(query)
    .populate("petId", "name kind breed")
    .populate("customerId", "name whatsapp")
    .populate("doctorId", "name")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getLetter(id: string) {
  const letter = await LetterModel.findById(id)
    .populate("petId", "name kind breed gender furColor initialAge birthDate")
    .populate("customerId", "name whatsapp address")
    .populate("doctorId", "name")
    .lean();
  if (!letter) throw Object.assign(new Error("Surat tidak ditemukan"), { status: 404 });
  return letter as any;
}

async function generateLetterNumber(type: string) {
  const prefix = TYPE_PREFIX[type] ?? "SURAT";
  const year = new Date().getFullYear();
  const count = await LetterModel.countDocuments({ letterType: type, date: { $gte: new Date(year, 0, 1) } });
  return `${prefix}/${year}/${String(count + 1).padStart(3, "0")}`;
}

export async function createLetter(input: any) {
  // customerId otomatis dari pasien yang dipilih
  const pet = await PetModel.findById(input.petId).lean();
  if (!pet) throw Object.assign(new Error("Pasien tidak ditemukan"), { status: 404 });
  const customerId = input.customerId ?? pet.customerId;
  if (!customerId) throw Object.assign(new Error("Pasien tidak punya pemilik"), { status: 400 });

  const letterNumber = await generateLetterNumber(input.letterType);
  const letter = await LetterModel.create({
    ...input,
    customerId,
    letterNumber,
    signedAt: input.ownerSignature ? new Date() : undefined,
  });
  return letter.toObject() as any;
}

export async function updateLetter(id: string, input: any) {
  const patch: any = { ...input };
  if (input.ownerSignature !== undefined) {
    patch.signedAt = input.ownerSignature ? new Date() : undefined;
  }
  const letter = await LetterModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  if (!letter) throw Object.assign(new Error("Surat tidak ditemukan"), { status: 404 });
  return letter as any;
}

export async function deleteLetter(id: string) {
  const letter = await LetterModel.findByIdAndDelete(id).lean();
  if (!letter) throw Object.assign(new Error("Surat tidak ditemukan"), { status: 404 });
  return letter as any;
}
