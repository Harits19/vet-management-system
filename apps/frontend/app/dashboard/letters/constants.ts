// Metadata 6 jenis surat klinik (sama dengan backend LETTER_TYPES)
export const LETTER_TYPE_META: Record<string, { label: string; code: string; subjectLabel: string; color: string }> = {
  surgery: { label: "Surat Persetujuan Operasi", code: "SPO", subjectLabel: "Jenis Operasi", color: "red" },
  anesthesia: { label: "Surat Persetujuan Pembiusan", code: "SPB", subjectLabel: "Jenis Pembiusan / Anestesi", color: "orange" },
  inpatient: { label: "Surat Persetujuan Rawat Inap", code: "SPRI", subjectLabel: "Lama / Rencana Rawat Inap", color: "blue" },
  referral: { label: "Surat Rujukan", code: "SR", subjectLabel: "Tujuan Rujukan", color: "purple" },
  boarding: { label: "Surat Persetujuan Penitipan Hewan", code: "SPPH", subjectLabel: "Lama / Rencana Penitipan", color: "cyan" },
  euthanasia: { label: "Surat Persetujuan Euthanasia", code: "SPE", subjectLabel: "Alasan Euthanasia", color: "magenta" },
};

export const LETTER_TYPE_OPTIONS = Object.entries(LETTER_TYPE_META).map(([value, m]) => ({ value, label: m.label }));

export const letterTypeLabel = (t: string) => LETTER_TYPE_META[t]?.label ?? t;
export const letterTypeColor = (t: string) => LETTER_TYPE_META[t]?.color ?? "default";

// Paragraf pernyataan per jenis surat
export const LETTER_BODY: Record<string, string> = {
  surgery:
    "Dengan ini saya, pemilik hewan tersebut di atas, menyatakan PERSETUJUAN untuk dilakukan tindakan OPERASI pada hewan peliharaan saya. Saya telah mendapat penjelasan mengenai tujuan, prosedur, serta risiko yang mungkin timbul dari tindakan tersebut.",
  anesthesia:
    "Dengan ini saya, pemilik hewan tersebut di atas, menyatakan PERSETUJUAN untuk dilakukan PEMBIUSAN (anestesi) pada hewan peliharaan saya. Saya telah mendapat penjelasan mengenai prosedur serta risiko yang mungkin timbul dari pembiusan tersebut.",
  inpatient:
    "Dengan ini saya, pemilik hewan tersebut di atas, menyatakan PERSETUJUAN untuk hewan peliharaan saya diRAWAT INAP di klinik sesuai rencana yang tertera. Saya menyetujui biaya serta perawatan yang diberikan selama masa rawat inap.",
  referral:
    "Surat rujukan ini diberikan untuk hewan peliharaan tersebut di atas sebagai rujukan pemeriksaan / tindak lanjut ke tujuan yang tertera di bawah ini.",
  boarding:
    "Dengan ini saya, pemilik hewan tersebut di atas, menyatakan PERSETUJUAN untuk menitipkan hewan peliharaan saya di klinik sesuai rencana penitipan yang tertera. Saya memahami ketentuan penitipan serta biaya yang berlaku.",
  euthanasia:
    "Dengan ini saya, pemilik hewan tersebut di atas, menyatakan PERSETUJUAN atas tindakan EUTHANASIA pada hewan peliharaan saya dengan alasan yang tertera. Keputusan ini saya ambil secara sadar setelah mendapat penjelasan dari dokter hewan.",
};
