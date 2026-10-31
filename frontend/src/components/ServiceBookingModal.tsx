import React, { useMemo, useState } from 'react';
import { Calendar, Car, Check, Clock, Info, ShieldAlert, X } from 'lucide-react';
import { formatBRL, usePetHub } from '../context/PetHubContext';
import type { PetSize } from '../types/pethub';

export const ServiceBookingModal: React.FC = () => {
  const {
    bookingModalService,
    closeBookingModal,
    pets,
    selectedPet,
    stores,
    setCartServiceBooking,
    setIsCartOpen,
  } = usePetHub();

  const [chosenPetId, setChosenPetId] = useState<string>(selectedPet.id);
  const [dateLabel, setDateLabel] = useState<'Hoje' | 'Amanhã'>('Hoje');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [taxiDog, setTaxiDog] = useState<boolean>(false);

  const activePet = useMemo(
    () => pets.find((p) => p.id === chosenPetId) ?? selectedPet,
    [pets, chosenPetId, selectedPet]
  );

  if (!bookingModalService) return null;

  const store =
    stores.find((s) => s.id === bookingModalService.storeId) ?? stores[0];
  const slots = dateLabel === 'Hoje' ? store.slotsToday : store.slotsTomorrow;
  const petSize: PetSize = activePet.size;
  const basePrice = bookingModalService.priceBySize[petSize];
  const finalPrice = basePrice + (taxiDog ? 15 : 0);

  const handleConfirm = () => {
    if (!selectedTime) return;
    setCartServiceBooking({
      service: bookingModalService,
      petId: activePet.id,
      petName: `${activePet.name} (${activePet.breed})`,
      petSize,
      dateLabel,
      timeSlot: selectedTime,
      taxiDog,
      price: basePrice,
    });
    closeBookingModal();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#302B29]/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-[#FFF6EB] text-[#302B29] shadow-2xl max-h-[90dvh] overflow-y-auto">
        {/* Header Image */}
        <div className="relative h-36 w-full overflow-hidden rounded-t-3xl">
          <img
            src={bookingModalService.imageUrl}
            alt={bookingModalService.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#302B29]/80 via-[#302B29]/25 to-transparent" />
          <button
            onClick={closeBookingModal}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#FFF6EB]/90 text-[#302B29] flex items-center justify-center shadow-md hover:bg-white cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-[#FFF6EB]">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#B65744] text-[11px] font-bold mb-1">
              {store.name}
            </span>
            <h3 className="text-lg font-extrabold leading-tight">
              {bookingModalService.name}
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1: Select Pet & Auto Size (REQ-02) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#302B29]/70">
                1. Selecione o Pet (Define Porte & Baia)
              </label>
              <span className="text-xs font-bold text-[#A9503B]">
                Porte {petSize}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {pets.map((pet) => {
                const isSelected = pet.id === activePet.id;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => {
                      setChosenPetId(pet.id);
                      setSelectedTime('');
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-left transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#A9503B] text-[#FFF6EB] border-[#A9503B] shadow-sm'
                        : 'bg-white text-[#302B29] border-[#C57969]/30 hover:border-[#B65744]'
                    }`}
                  >
                    <img
                      src={pet.avatarUrl}
                      alt={pet.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/50"
                    />
                    <div>
                      <div className="text-xs font-extrabold leading-tight">
                        {pet.name}
                      </div>
                      <div
                        className={`text-[11px] ${
                          isSelected ? 'text-[#FFF6EB]/85' : 'text-[#302B29]/60'
                        }`}
                      >
                        {pet.size} • {pet.weightKg}kg
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Date selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#302B29]/70 mb-2">
              2. Data do Agendamento (RN-01: Mín. 2h antecedência)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Hoje', 'Amanhã'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDateLabel(d);
                    setSelectedTime('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
                    dateLabel === d
                      ? 'bg-[#B65744]/15 border-[#B65744] text-[#A9503B]'
                      : 'bg-white border-[#302B29]/10 text-[#302B29]/75'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {d} {d === 'Hoje' ? '(Baias livres)' : '(Grade completa)'}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Bay Slots filtered by Pet Size (REQ-02) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#302B29]/70">
                3. Horários na Baia ({petSize})
              </label>
              <span className="text-[11px] text-[#302B29]/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#B65744]" />~
                {bookingModalService.durationMinutes} min
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const availableForSize = slot.availableSizes.includes(petSize);
                const active = selectedTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!availableForSize}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition flex flex-col items-center cursor-pointer disabled:cursor-not-allowed ${
                      !availableForSize
                        ? 'bg-[#302B29]/5 border-[#302B29]/10 text-[#302B29]/35 line-through'
                        : active
                          ? 'bg-[#A9503B] border-[#A9503B] text-[#FFF6EB] shadow-sm'
                          : 'bg-white border-[#C57969]/35 text-[#302B29] hover:border-[#B65744]'
                    }`}
                  >
                    <span>{slot.time}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        !availableForSize
                          ? 'text-[#302B29]/35'
                          : active
                            ? 'text-[#F3B63F]'
                            : 'text-[#A9503B]'
                      }`}
                    >
                      {availableForSize ? 'Baia livre' : 'Ocupada'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Taxi Dog */}
          <button
            type="button"
            onClick={() => setTaxiDog((v) => !v)}
            className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
              taxiDog
                ? 'bg-[#F3B63F]/15 border-[#F3B63F] text-[#302B29]'
                : 'bg-white border-[#302B29]/10 text-[#302B29]'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#B65744]/12 text-[#A9503B] flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold">
                  Táxi Dog Busca & Leva Climatizado
                </div>
                <div className="text-[11px] text-[#302B29]/65">
                  Retirada e entrega segura na porta de casa
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#A9503B]">
                + R$ 15,00
              </span>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  taxiDog
                    ? 'bg-[#A9503B] border-[#A9503B] text-white'
                    : 'border-[#302B29]/25'
                }`}
              >
                {taxiDog && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          </button>

          {/* RN-05 & RN-06 Business Rule Notice */}
          <div className="rounded-2xl bg-[#C57969]/12 border border-[#C57969]/30 p-3 space-y-1 text-[11px] text-[#302B29]/80">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#A9503B] shrink-0 mt-0.5" />
              <span>
                <strong>Política de Tolerância (RN-05):</strong> Tolerância de 15
                min para chegada no petshop. No-show incide taxa de 20%.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-[#A9503B] shrink-0 mt-0.5" />
              <span>
                <strong>Triagem Sanitária (RN-06):</strong> Suspeita de
                ectoparasitas na recepção requer banho terapêutico mediante seu
                aceite no app.
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={!selectedTime}
            onClick={handleConfirm}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#A9503B] hover:bg-[#B65744] disabled:bg-[#302B29]/20 disabled:text-[#302B29]/45 text-[#FFF6EB] font-extrabold text-sm shadow-md flex items-center justify-between transition cursor-pointer disabled:cursor-not-allowed"
          >
            <span>
              {selectedTime
                ? `Incluir na Comanda (${dateLabel}, ${selectedTime})`
                : 'Escolha um horário na grade'}
            </span>
            <span>{formatBRL(finalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
