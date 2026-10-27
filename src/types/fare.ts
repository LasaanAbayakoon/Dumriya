/** `firstAC` covers air-conditioned 1st class; `observation` is the 1st class observation saloon. */
export type TravelClass = 'firstAC' | 'observation' | 'second' | 'third';

export interface Fare {
  travelClass: TravelClass;
  /** Ticket price in LKR for one adult, before the online convenience fee. */
  amountLkr: number;
  /** Whether seats in this class can be reserved online. Otherwise unreserved (buy at counter / Pravesha). */
  reservable: boolean;
}
