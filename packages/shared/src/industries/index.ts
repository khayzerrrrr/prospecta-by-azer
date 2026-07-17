export interface IndustrySpec {
  id: string;
  label: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  gradient: string;
  icon: string;
  dotColor: string;
  // Lead form — complete unique fields per industry
  leadFields: { key: string; label: string; placeholder: string; type: string; options?: string[]; required?: boolean; col?: "full" | "half" }[];
  // Company name placeholder
  companyLabel: string;
  companyPlaceholder: string;
  // Contact role suggestions
  contactRoles: string[];
  contactLabel: string;
  // Pipeline stages — seeded as real pipeline_stages rows at company
  // provisioning time (see company.service.ts), not rendered client-side.
  pipelineStages: { name: string; color: string; emoji: string; probability: number; isWon?: boolean; isLost?: boolean }[];
  // Visit templates
  visitTemplates: { label: string; description: string }[];
  // Dashboard metrics labels
  metrics: { visits: string; pipeline: string; conversion: string; followUp: string };
}

export const INDUSTRIES: Record<string, IndustrySpec> = {
  education: {
    id: "education", label: "Education B2B", color: "violet", dotColor: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800", gradient: "from-violet-500 to-purple-600", icon: "GraduationCap",
    companyLabel: "Nama Sekolah / Institusi",
    companyPlaceholder: "contoh: SMA Negeri 1 Jakarta",
    contactLabel: "PIC Sekolah",
    contactRoles: ["Kepala Sekolah", "Wakasek Kurikulum", "Wakasek Sarana", "Ketua Yayasan", "Pengurus Yayasan", "Kepala Perpustakaan", "Kepala TU", "Staff IT", "Guru", "Bendahara BOS", "Komite Sekolah"],
    leadFields: [
      { key: "eduBizType", label: "Jenis Bisnis *", placeholder: "Pilih jenis bisnis", type: "select", options: ["Sales BUKU", "Program Sekolah", "Software Sekolah", "Pengadaan Barang"], required: true, col: "full" },
      { key: "schoolType", label: "Status Sekolah", placeholder: "Pilih", type: "select", options: ["Negeri", "Swasta", "Madrasah", "Pesantren", "Internasional"], required: true, col: "half" },
      { key: "unitTypes", label: "Unit (TK/SD/SMP/SMA/SMK)", placeholder: "contoh: SD, SMP, SMA", type: "text", col: "half" },
      { key: "totalStudents", label: "Total Siswa", placeholder: "1200", type: "number", col: "half" },
      { key: "teacherCount", label: "Jumlah Guru", placeholder: "60", type: "number", col: "half" },
      { key: "annualBudget", label: "Budget Tahunan (Rp)", placeholder: "500000000", type: "number", col: "half" },
      { key: "decisionMaker", label: "Pengambil Keputusan", placeholder: "Pilih", type: "select", options: ["Kepsek Langsung", "Komite Sekolah", "Yayasan", "Dinas Pendidikan", "BOS/Tim Anggaran"], col: "half" },
      { key: "currentProvider", label: "Vendor/Penyedia Saat Ini", placeholder: "contoh: Erlangga, RuangGuru", type: "text", col: "full" },
      { key: "interestProduct", label: "Produk/Program Diminati", placeholder: "Sebutkan detail produk", type: "text", col: "full" },
      { key: "expectedVolume", label: "Estimasi Volume/Unit", placeholder: "contoh: 500 eksemplar, 3 lisensi", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Visit 1 - Survey", color: "#8B5CF6", emoji: "🔍", probability: 20 },
      { name: "Visit 2 - Demo/Sample", color: "#6366F1", emoji: "🎯", probability: 40 },
      { name: "Visit 3 - Presentasi", color: "#3B82F6", emoji: "📋", probability: 65 },
      { name: "Penawaran Harga", color: "#F59E0B", emoji: "💰", probability: 80 },
      { name: "PO / Kontrak", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Closed Lost", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Visit 1 - Survey", description: "Survey kebutuhan & temui PIC" },
      { label: "Visit 2 - Demo/Sample", description: "Demo produk / serahkan sample" },
      { label: "Visit 3 - Penawaran", description: "Presentasi penawaran harga" },
    ],
    metrics: { visits: "Visit Sekolah", pipeline: "Pipeline B2B Edu", conversion: "Win Rate", followUp: "Follow-up PIC" },
  },

  banking: {
    id: "banking", label: "Banking", color: "emerald", dotColor: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-500 to-teal-600", icon: "Store",
    companyLabel: "Nama Perusahaan / Nasabah",
    companyPlaceholder: "contoh: PT Maju Bersama",
    contactLabel: "Penanggung Jawab",
    contactRoles: ["Direktur Utama", "Direktur Keuangan", "Branch Manager", "Kepala Divisi", "Finance Manager", "Corporate Secretary"],
    leadFields: [
      { key: "loanAmount", label: "Plafon Kredit (Rp)", placeholder: "5000000000", type: "number", col: "half" },
      { key: "riskScore", label: "Risk Score (1-5)", placeholder: "2", type: "select", options: ["1", "2", "3", "4", "5"], col: "half" },
      { key: "loanType", label: "Jenis Pembiayaan", placeholder: "Pilih", type: "select", options: ["Kredit Modal Kerja", "Kredit Investasi", "Kredit Konsumsi", "Trade Finance", "Bank Garansi", "Lainnya"], col: "half" },
      { key: "tenor", label: "Tenor (bulan)", placeholder: "24", type: "number", col: "half" },
      { key: "collateral", label: "Jaminan", placeholder: "Sertifikat Tanah, Deposito", type: "text", col: "half" },
      { key: "existingBank", label: "Bank Existing", placeholder: "Mandiri, BCA, BNI", type: "text", col: "half" },
      { key: "annualRevenue", label: "Revenue Tahunan (Rp)", placeholder: "50000000000", type: "number", col: "full" },
      { key: "businessCategory", label: "Kategori Bisnis", placeholder: "Pilih", type: "select", options: ["Korporasi", "UMKM", "Startup", "BUMN", "Pemerintah"], col: "full" },
    ],
    pipelineStages: [
      { name: "Data Gathering", color: "#10B981", emoji: "📊", probability: 15 },
      { name: "Analisa Kredit", color: "#059669", emoji: "🔬", probability: 35 },
      { name: "Appraisal", color: "#F59E0B", emoji: "🏢", probability: 55 },
      { name: "Komite Kredit", color: "#3B82F6", emoji: "👥", probability: 75 },
      { name: "Akad Kredit", color: "#8B5CF6", emoji: "📝", probability: 95 },
      { name: "Disbursed", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Ditolak", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Visit Nasabah", description: "Kunjungan ke lokasi usaha" },
      { label: "Appraisal Aset", description: "Penilaian jaminan kredit" },
      { label: "Meeting Komite", description: "Presentasi ke komite kredit" },
      { label: "Akad Kredit", description: "Penandatanganan perjanjian" },
    ],
    metrics: { visits: "Kunjungan Nasabah", pipeline: "Pipeline Kredit", conversion: "Approval Rate", followUp: "Follow-up Kredit" },
  },

  healthcare: {
    id: "healthcare", label: "Healthcare", color: "rose", dotColor: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", gradient: "from-rose-500 to-pink-600", icon: "Heart",
    companyLabel: "Nama RS / Klinik / Apotek",
    companyPlaceholder: "contoh: RS Husada Utama",
    contactLabel: "Dokter / Penanggung Jawab",
    contactRoles: ["Direktur RS", "Dokter Spesialis", "Dokter Umum", "Kepala Farmasi", "Kepala Keperawatan", "Manager Pengadaan", "Apoteker"],
    leadFields: [
      { key: "specialization", label: "Spesialisasi", placeholder: "Pilih", type: "select", options: ["Umum", "Kardiologi", "Onkologi", "Pediatri", "Bedah", "Obgyn", "Interna", "Saraf", "Mata", "Lainnya"], col: "half" },
      { key: "hospitalType", label: "Tipe Institusi", placeholder: "Pilih", type: "select", options: ["RS Pemerintah", "RS Swasta", "RSIA", "Klinik", "Puskesmas", "Apotek", "Lab Klinik"], col: "half" },
      { key: "bedCount", label: "Jumlah Tempat Tidur", placeholder: "200", type: "number", col: "half" },
      { key: "bpjsPartner", label: "Partner BPJS?", placeholder: "Pilih", type: "select", options: ["Ya", "Tidak"], col: "half" },
      { key: "pharmacySystem", label: "Sistem Farmasi", placeholder: "SIM RS, Manual", type: "text", col: "half" },
      { key: "dailyPatients", label: "Pasien/Hari", placeholder: "500", type: "number", col: "half" },
      { key: "interestProduct", label: "Produk Diminati", placeholder: "Alat Medis, Obat, IT RS", type: "text", col: "full" },
      { key: "registrationNo", label: "No Izin/SIP", placeholder: "Nomor izin", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Kunjungan Awal", color: "#F43F5E", emoji: "🏥", probability: 20 },
      { name: "Presentasi Produk", color: "#E11D48", emoji: "💊", probability: 40 },
      { name: "Uji Coba / Sampel", color: "#3B82F6", emoji: "🧪", probability: 60 },
      { name: "Evaluasi", color: "#F59E0B", emoji: "📊", probability: 80 },
      { name: "PO / Kontrak", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Closed Lost", color: "#6B7280", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Detail Dokter", description: "Kunjungan ke dokter spesialis" },
      { label: "Visit RS", description: "Kunjungan ke direksi RS" },
      { label: "Presentasi Alkes", description: "Demo alat kesehatan" },
      { label: "Follow-up Farmasi", description: "Kunjungan ke apotek/farmasi" },
    ],
    metrics: { visits: "Kunjungan Medis", pipeline: "Pipeline Healthcare", conversion: "Konversi RS", followUp: "Follow-up Medis" },
  },

  property: {
    id: "property", label: "Property", color: "amber", dotColor: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", gradient: "from-amber-500 to-orange-600", icon: "Home",
    companyLabel: "Nama Developer / Agen",
    companyPlaceholder: "contoh: PT Property Utama",
    contactLabel: "Kontak",
    contactRoles: ["CEO/Owner", "Sales Director", "Project Manager", "Marketing Manager", "Agen Property", "Site Manager"],
    leadFields: [
      { key: "projectName", label: "Nama Project", placeholder: "Grand Residence", type: "text", col: "half" },
      { key: "unitType", label: "Tipe Unit", placeholder: "Pilih", type: "select", options: ["Landed House", "Apartment", "Townhouse", "Ruko", "Commercial", "Industrial", "Kavling"], col: "half" },
      { key: "totalUnits", label: "Total Unit", placeholder: "250", type: "number", col: "half" },
      { key: "priceRange", label: "Harga Mulai (Rp)", placeholder: "500000000", type: "number", col: "half" },
      { key: "location", label: "Lokasi Project", placeholder: "Jakarta Selatan", type: "text", col: "half" },
      { key: "developmentStage", label: "Tahap Pembangunan", placeholder: "Pilih", type: "select", options: ["Pra-Launch", "Launching", "Konstruksi", "Serah Terima", "Secondary"], col: "half" },
      { key: "targetMarket", label: "Target Market", placeholder: "First home buyer, Investor", type: "text", col: "full" },
      { key: "paymentScheme", label: "Skema Bayar", placeholder: "Cash, KPR, Cash Bertahap", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Prospek", color: "#F59E0B", emoji: "🔍", probability: 10 },
      { name: "Site Visit", color: "#D97706", emoji: "🏠", probability: 30 },
      { name: "Booking Fee", color: "#3B82F6", emoji: "📋", probability: 50 },
      { name: "KPR Process", color: "#8B5CF6", emoji: "🏦", probability: 75 },
      { name: "Akad / AJB", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Batal", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Site Visit", description: "Kunjungan ke lokasi project" },
      { label: "Meeting Developer", description: "Diskusi dengan developer" },
      { label: "Open House", description: "Acara pameran properti" },
      { label: "Serah Terima", description: "Serah terima kunci unit" },
    ],
    metrics: { visits: "Site Visit", pipeline: "Pipeline Properti", conversion: "Closing Rate", followUp: "Follow-up Unit" },
  },

  automotive: {
    id: "automotive", label: "Automotive", color: "blue", dotColor: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", gradient: "from-blue-500 to-sky-600", icon: "Car",
    companyLabel: "Nama Dealer / Bengkel",
    companyPlaceholder: "contoh: Auto Jaya Motor",
    contactLabel: "Kontak",
    contactRoles: ["Dealer Owner", "Sales Manager", "Service Manager", "Fleet Manager", "Parts Manager", "Finance Manager"],
    leadFields: [
      { key: "brand", label: "Brand Utama", placeholder: "Toyota, Honda, BMW", type: "text", col: "half" },
      { key: "dealerType", label: "Tipe Bisnis", placeholder: "Pilih", type: "select", options: ["Dealer Resmi", "Showroom Independen", "Bengkel Resmi", "Bengkel Umum", "Sparepart", "Leasing"], col: "half" },
      { key: "monthlyVolume", label: "Volume/Bulan (unit)", placeholder: "50", type: "number", col: "half" },
      { key: "employeeCount", label: "Karyawan", placeholder: "30", type: "number", col: "half" },
      { key: "financingPartners", label: "Partner Leasing", placeholder: "Adira, BAF, MUF", type: "text", col: "half" },
      { key: "showroomSize", label: "Luas Showroom (m²)", placeholder: "500", type: "number", col: "half" },
      { key: "interestProduct", label: "Produk Diminati", placeholder: "Unit, Sparepart, Tools", type: "text", col: "full" },
      { key: "customerBase", label: "Basis Pelanggan", placeholder: "Retail, Fleet, Government", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Prospek", color: "#3B82F6", emoji: "🔍", probability: 15 },
      { name: "Test Drive", color: "#2563EB", emoji: "🚗", probability: 35 },
      { name: "Penawaran", color: "#F59E0B", emoji: "💰", probability: 60 },
      { name: "Kredit Process", color: "#8B5CF6", emoji: "🏦", probability: 85 },
      { name: "Delivery", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Lost", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Test Drive", description: "Test drive kendaraan" },
      { label: "Visit Dealer", description: "Kunjungan ke dealer" },
      { label: "Fleet Presentation", description: "Presentasi ke corporate" },
      { label: "Service Follow-up", description: "Follow-up servis berkala" },
    ],
    metrics: { visits: "Kunjungan Dealer", pipeline: "Pipeline Otomotif", conversion: "Closing Rate", followUp: "Follow-up Unit" },
  },

  manufacturing: {
    id: "manufacturing", label: "Manufacturing", color: "slate", dotColor: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-900/20", text: "text-slate-700 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800", gradient: "from-slate-500 to-gray-600", icon: "Factory",
    companyLabel: "Nama Pabrik / Perusahaan",
    companyPlaceholder: "contoh: PT Industri Makmur",
    contactLabel: "Kontak",
    contactRoles: ["Plant Manager", "Supply Chain Manager", "Procurement Manager", "Quality Manager", "Engineering Manager", "Production Supervisor"],
    leadFields: [
      { key: "industrySector", label: "Sektor Industri", placeholder: "Pilih", type: "select", options: ["Makanan & Minuman", "Tekstil", "Elektronik", "Otomotif Parts", "Kimia", "Farmasi", "Logam", "Plastik", "Lainnya"], col: "half" },
      { key: "productionCapacity", label: "Kapasitas Produksi", placeholder: "10.000 unit/bulan", type: "text", col: "half" },
      { key: "employeeCount", label: "Jumlah Karyawan", placeholder: "500", type: "number", col: "half" },
      { key: "certifications", label: "Sertifikasi", placeholder: "ISO 9001, HACCP, SNI", type: "text", col: "half" },
      { key: "rawMaterials", label: "Bahan Baku Utama", placeholder: "Baja, Plastik, Kimia", type: "text", col: "full" },
      { key: "annualProcurement", label: "Budget Procurement (Rp)", placeholder: "50000000000", type: "number", col: "half" },
      { key: "exportMarket", label: "Pasar Ekspor", placeholder: "ASEAN, Eropa, US", type: "text", col: "half" },
      { key: "currentSupplier", label: "Supplier Saat Ini", placeholder: "Nama supplier existing", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Kualifikasi", color: "#64748B", emoji: "🔍", probability: 10 },
      { name: "Audit Pabrik", color: "#475569", emoji: "🏭", probability: 30 },
      { name: "Sample / Trial", color: "#3B82F6", emoji: "🧪", probability: 50 },
      { name: "Penawaran", color: "#F59E0B", emoji: "💰", probability: 75 },
      { name: "PO / Kontrak", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Gagal", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Audit Pabrik", description: "Inspeksi fasilitas produksi" },
      { label: "Visit Supplier", description: "Kunjungan ke calon supplier" },
      { label: "Meeting Procurement", description: "Diskusi dengan tim pengadaan" },
      { label: "Quality Check", description: "Pengecekan kualitas produk" },
    ],
    metrics: { visits: "Kunjungan Pabrik", pipeline: "Pipeline Manufaktur", conversion: "Win Rate", followUp: "Follow-up RFQ" },
  },

  retail: {
    id: "retail", label: "Retail", color: "pink", dotColor: "bg-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-700 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800", gradient: "from-pink-500 to-fuchsia-600", icon: "ShoppingBag",
    companyLabel: "Nama Toko / Gerai",
    companyPlaceholder: "contoh: Toko Berkah Jaya",
    contactLabel: "Kontak",
    contactRoles: ["Store Owner", "Store Manager", "Purchasing Manager", "Category Manager", "Merchandiser", "Area Supervisor"],
    leadFields: [
      { key: "storeType", label: "Tipe Toko", placeholder: "Pilih", type: "select", options: ["Toko Kelontong", "Minimarket", "Supermarket", "Specialty Store", "Department Store", "E-commerce", "Warung"], col: "half" },
      { key: "location", label: "Lokasi", placeholder: "Mall, Ruko, Pasar", type: "select", options: ["Mall", "Ruko", "Pasar", "Pinggir Jalan", "Perumahan"], col: "half" },
      { key: "footTraffic", label: "Foot Traffic/hari", placeholder: "500", type: "number", col: "half" },
      { key: "storeSize", label: "Luas Toko (m²)", placeholder: "100", type: "number", col: "half" },
      { key: "paymentMethods", label: "Metode Bayar", placeholder: "Cash, QRIS, Kartu", type: "text", col: "full" },
      { key: "monthlyRevenue", label: "Omset/Bulan (Rp)", placeholder: "50000000", type: "number", col: "half" },
      { key: "productCategory", label: "Kategori Produk", placeholder: "Sembako, Snack, Minuman", type: "text", col: "half" },
      { key: "supplierCount", label: "Jumlah Supplier", placeholder: "10", type: "number", col: "full" },
    ],
    pipelineStages: [
      { name: "Survey Outlet", color: "#EC4899", emoji: "🔍", probability: 20 },
      { name: "Sampling", color: "#DB2777", emoji: "🎁", probability: 40 },
      { name: "Negosiasi", color: "#F59E0B", emoji: "💬", probability: 65 },
      { name: "Trial Order", color: "#3B82F6", emoji: "📦", probability: 85 },
      { name: "Kontrak Supply", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Lost", color: "#6B7280", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Store Visit", description: "Kunjungan ke toko/gerai" },
      { label: "Merchandising Check", description: "Cek display produk" },
      { label: "Meeting Distributor", description: "Diskusi dengan distributor" },
      { label: "Survey Outlet Baru", description: "Survey lokasi baru" },
    ],
    metrics: { visits: "Store Visit", pipeline: "Pipeline Retail", conversion: "Closing Rate", followUp: "Follow-up Toko" },
  },

  saas: {
    id: "saas", label: "SaaS", color: "cyan", dotColor: "bg-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800", gradient: "from-cyan-500 to-sky-600", icon: "Cloud",
    companyLabel: "Nama Perusahaan",
    companyPlaceholder: "contoh: TechStart Indo",
    contactLabel: "Kontak",
    contactRoles: ["CEO/Founder", "CTO", "VP Engineering", "VP Sales", "Product Manager", "IT Manager", "Head of Digital"],
    leadFields: [
      { key: "companySize", label: "Ukuran Perusahaan", placeholder: "Pilih", type: "select", options: ["1-10", "11-50", "51-200", "201-500", "500+"], col: "half" },
      { key: "industry", label: "Industri", placeholder: "Fintech, E-commerce, Health", type: "text", col: "half" },
      { key: "currentTools", label: "Tools Saat Ini", placeholder: "Zoho, Trello, Hubspot", type: "text", col: "full" },
      { key: "monthlyBudget", label: "Budget/Bulan (Rp)", placeholder: "5000000", type: "number", col: "half" },
      { key: "decisionMaker", label: "Decision Maker", placeholder: "CTO, CEO, VP", type: "text", col: "half" },
      { key: "painPoints", label: "Pain Points", placeholder: "Manual tracking, No CRM", type: "text", col: "full" },
      { key: "timeline", label: "Timeline Implementasi", placeholder: "1 bulan, 3 bulan, Segera", type: "text", col: "half" },
      { key: "teamSize", label: "Tim Yang Terlibat", placeholder: "5-10 orang", type: "number", col: "half" },
    ],
    pipelineStages: [
      { name: "Lead Qualified", color: "#06B6D4", emoji: "🔍", probability: 15 },
      { name: "Demo/POC", color: "#0891B2", emoji: "🎯", probability: 35 },
      { name: "Technical Eval", color: "#3B82F6", emoji: "⚙️", probability: 55 },
      { name: "Proposal", color: "#F59E0B", emoji: "📋", probability: 75 },
      { name: "Closed Won", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Closed Lost", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Product Demo", description: "Demo produk ke prospect" },
      { label: "Technical POC", description: "Proof of concept teknis" },
      { label: "QBR Meeting", description: "Quarterly business review" },
      { label: "Onboarding Visit", description: "Training & onboarding" },
    ],
    metrics: { visits: "Demo/POC", pipeline: "Pipeline SaaS", conversion: "Win Rate", followUp: "Follow-up Trial" },
  },

  distributor: {
    id: "distributor", label: "Distributor", color: "orange", dotColor: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", gradient: "from-orange-500 to-amber-600", icon: "Truck",
    companyLabel: "Nama Distributor / Agen",
    companyPlaceholder: "contoh: CV Sumber Makmur",
    contactLabel: "Kontak",
    contactRoles: ["Pemilik", "Sales Manager", "Supervisor Lapangan", "Admin Gudang", "Driver/Salesman", "Purchasing"],
    leadFields: [
      { key: "coverage", label: "Area Coverage", placeholder: "Jakarta, Bandung, Semarang", type: "text", col: "full" },
      { key: "agentCount", label: "Jumlah Agen/Outlet", placeholder: "50", type: "number", col: "half" },
      { key: "monthlyOrder", label: "Volume Order/Bulan", placeholder: "1000 unit", type: "text", col: "half" },
      { key: "productType", label: "Jenis Produk", placeholder: "Pilih", type: "select", options: ["FMCG", "Makanan & Minuman", "Elektronik", "Farmasi", "ATK", "Rokok", "Lainnya"], col: "half" },
      { key: "warehouseSize", label: "Kapasitas Gudang (m²)", placeholder: "500", type: "number", col: "half" },
      { key: "fleetSize", label: "Jumlah Armada", placeholder: "5 mobil, 10 motor", type: "text", col: "half" },
      { key: "paymentTerm", label: "Term Pembayaran", placeholder: "Cash, 7 hari, 30 hari", type: "text", col: "half" },
      { key: "currentBrands", label: "Brand Yang Dipegang", placeholder: "Indofood, Wings, Unilever", type: "text", col: "full" },
    ],
    pipelineStages: [
      { name: "Prospek", color: "#F97316", emoji: "🔍", probability: 15 },
      { name: "Survey Gudang", color: "#EA580C", emoji: "🏭", probability: 35 },
      { name: "Sample Order", color: "#3B82F6", emoji: "📦", probability: 55 },
      { name: "Negosiasi Term", color: "#F59E0B", emoji: "💰", probability: 80 },
      { name: "Kontrak Distribusi", color: "#10B981", emoji: "✅", probability: 100, isWon: true },
      { name: "Lost", color: "#EF4444", emoji: "❌", probability: 0, isLost: true },
    ],
    visitTemplates: [
      { label: "Visit Agen", description: "Kunjungan ke agen" },
      { label: "Stock Check", description: "Pengecekan stok" },
      { label: "Order Taking", description: "Pengambilan pesanan" },
      { label: "Market Survey", description: "Survey pasar" },
    ],
    metrics: { visits: "Visit Agen", pipeline: "Pipeline Distribusi", conversion: "Closing Rate", followUp: "Follow-up Agen" },
  },
};
