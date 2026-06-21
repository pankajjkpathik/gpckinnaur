export function InstitutionalHeader() {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold text-xl shrink-0">
            GPK
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[color:var(--navy)] leading-tight">
              Government Polytechnic, Kinnaur
            </h1>
            <p className="text-sm text-muted-foreground">Himachal Pradesh</p>
            <p className="text-xs text-muted-foreground italic">
              Camp at Government Polytechnic Rohru, Distt. Shimla (HP)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--navy)] text-white">
                Affiliated: HP Takniki Shiksha Board
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold">
                Approved: AICTE
              </span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center">
          <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs text-center leading-tight">
            HP<br/>GOVT
          </div>
        </div>
      </div>
    </header>
  );
}
