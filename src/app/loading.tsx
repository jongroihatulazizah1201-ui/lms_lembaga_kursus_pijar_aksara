import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <LoadingSpinner
        size="lg"
        variant="primary"
        label="Memuat Pijar Aksara..."
        sublabel="Menyiapkan data dan materi pelatihan vokasi"
        delayMs={150}
      />
    </div>
  );
}
