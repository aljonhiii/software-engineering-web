import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  RefreshCw,
  X,
  Menu,
  ArrowUpRight,
  ChevronDown,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { fetchPublicKiosks, submitCustomerInquiry } from '../../api/client';
import { PublicKiosk } from '../../types';
import { KioskMap, MapKioskItem } from '../../components/map/KioskMap';
import { StatusBadge } from '../../components/common/StatusBadge';

const HERO_SLIDES = [
  {
    id: 'leather',
    label: 'Leather Shoes',
    category: 'Leather Shoes',
    image:
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85',
    cutout: '/shoes/leather.png',
  },
  {
    id: 'sneakers',
    label: 'Everyday Sneakers',
    category: 'Other Shoes',
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85',
    cutout: '/shoes/sneakers.png',
  },
  {
    id: 'running',
    label: 'Sports & Running',
    category: 'Other Shoes',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    cutout: '/shoes/sports.png',
  },
] as const;

const STEPS = [
  {
    step: '01',
    title: 'Pick shoe type',
    body: 'Choose Leather Shoes or Other Shoes on the kiosk screen.',
  },
  {
    step: '02',
    title: 'Select a cycle',
    body: 'Pick Sanitation (3m), Deodorize (4m), or Disinfection (5m).',
  },
  {
    step: '03',
    title: 'Pay cash or QR',
    body: 'Insert coins or bills, or scan QR Ph with GCash or Maya.',
  },
  {
    step: '04',
    title: 'Load your pair',
    body: 'Tuck laces inside your shoes and close the locked chamber door.',
  },
  {
    step: '05',
    title: 'Walk out clean',
    body: 'The door unlocks automatically as soon as the cycle finishes.',
  },
];

const SERVICES = [
  {
    name: 'Sanitation',
    time: '3 mins',
    price: '₱30',
    desc: 'Clears surface dust and wipes outer sole edges.',
  },
  {
    name: 'Deodorize',
    time: '4 mins',
    price: '₱40',
    desc: 'Removes sweat odor and airs out the interior.',
  },
  {
    name: 'Disinfection',
    time: '5 mins',
    price: '₱50',
    desc: 'Treats bacteria and fungi inside the lining and insoles.',
  },
];

const BENEFITS = [
  {
    title: 'Done in 3 to 5 minutes',
    body: 'No overnight drying or leaving your shoes at a shop.',
  },
  {
    title: 'Safe for leather and fabric',
    body: 'Separate foam and brush settings for leather and non-leather pairs.',
  },
  {
    title: 'Coins, bills, or QR Ph',
    body: 'Pay with loose change, paper bills, GCash, or Maya.',
  },
  {
    title: 'Locked while cleaning',
    body: 'The chamber door stays magnetically locked until your cycle is done.',
  },
  {
    title: 'UV light and warm air',
    body: 'Add UV treatment (+₱25) or warm air drying (+₱20) when needed.',
  },
  {
    title: 'Live kiosk status',
    body: 'Check the map to see if a kiosk is open before you walk over.',
  },
];

const FAQS = [
  {
    q: 'How long does one cleaning take?',
    a: 'Sanitation takes 3 minutes, Deodorize takes 4 minutes, and Disinfection takes 5 minutes.',
  },
  {
    q: 'What shoes can I put inside?',
    a: 'KixCleen supports two categories: Leather Shoes (dress shoes, boots, loafers) and Other Shoes (sneakers, school shoes, running shoes, and canvas).',
  },
  {
    q: 'How do I pay at the kiosk?',
    a: 'You can pay with coins (₱1 to ₱20), bills (₱20 to ₱100), or scan the on-screen QR Ph code with GCash or Maya.',
  },
  {
    q: 'What should I do before closing the door?',
    a: 'Place one pair upright on the tray and tuck the laces inside both shoes so they do not catch on the brushes.',
  },
  {
    q: 'How do I know if a kiosk is available right now?',
    a: 'Check the map on this page. Green markers mean the kiosk is online and ready for use.',
  },
];

export const KioskLocatorPage: React.FC = () => {
  const [kiosks, setKiosks] = useState<PublicKiosk[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null);
  const [detailModalKiosk, setDetailModalKiosk] = useState<PublicKiosk | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Customer Order & Inquiry Form State
  const [inqName, setInqName] = useState<string>('');
  const [inqPhone, setInqPhone] = useState<string>('');
  const [inqEmail, setInqEmail] = useState<string>('');
  const [inqLocation, setInqLocation] = useState<string>('KCC Mall de Zamboanga (Camino Nuevo)');
  const [inqType, setInqType] = useState<string>('Order Shoe Cleaning Service');
  const [inqPairs, setInqPairs] = useState<string>('1-2 Pairs');
  const [inqMessage, setInqMessage] = useState<string>('');
  const [inqSubmitting, setInqSubmitting] = useState<boolean>(false);
  const [inqSuccess, setInqSuccess] = useState<string | null>(null);
  const [inqError, setInqError] = useState<string | null>(null);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInqError(null);
    setInqSuccess(null);

    if (!inqName.trim() || !inqPhone.trim() || !inqEmail.trim()) {
      setInqError('Please fill in your name, contact phone number, and email.');
      return;
    }

    setInqSubmitting(true);
    try {
      const res = await submitCustomerInquiry({
        fullName: inqName.trim(),
        phone: inqPhone.trim(),
        email: inqEmail.trim(),
        preferredLocation: inqLocation,
        inquiryType: inqType,
        estimatedPairs: inqPairs,
        message: inqMessage.trim() || undefined,
      });

      if (res.success) {
        setInqSuccess(
          `Thank you, ${inqName.trim()}! Your order request (${res.inquiry.id}) was received. Our Zamboanga City team will reach out to you shortly.`
        );
        setInqName('');
        setInqPhone('');
        setInqEmail('');
        setInqMessage('');
      }
    } catch (err: any) {
      setInqError(err.message || 'Could not submit your request. Please try again.');
    } finally {
      setInqSubmitting(false);
    }
  };

  const loadKiosks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublicKiosks();
      const list = res.kiosks || [];
      setKiosks(list);
      if (list.length > 0 && !selectedKioskId) {
        const firstWithCoords =
          list.find((k: PublicKiosk) => k.hasValidCoordinates) || list[0];
        setSelectedKioskId(firstWithCoords.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load kiosk locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKiosks();
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    kiosks.forEach((k) => {
      if (k.city && k.city.trim()) set.add(k.city.trim());
    });
    return Array.from(set).sort();
  }, [kiosks]);

  const filteredKiosks = useMemo(() => {
    return kiosks.filter((k) => {
      if (selectedCity !== 'ALL' && k.city !== selectedCity) return false;
      if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = `${k.name} ${k.city} ${k.address} ${k.location} ${k.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [kiosks, selectedCity, statusFilter, searchQuery]);

  const mapItems: MapKioskItem[] = useMemo(
    () =>
      filteredKiosks.map((k) => ({
        id: k.id,
        name: k.name,
        address: k.address,
        city: k.city,
        location: k.location,
        latitude: k.latitude,
        longitude: k.longitude,
        hasValidCoordinates: k.hasValidCoordinates,
        status: k.status,
        operatingHours: k.operatingHours,
        currentActivity: k.currentActivity,
      })),
    [filteredKiosks]
  );

  const onlineCount = useMemo(
    () => kiosks.filter((k) => k.status === 'online' || k.status === 'busy').length,
    [kiosks]
  );

  const currentHero = HERO_SLIDES[activeSlide] ?? HERO_SLIDES[0];

  const handleSelectLocationCard = (kiosk: PublicKiosk) => {
    setSelectedKioskId(kiosk.id);
    setSelectedCity('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    document.getElementById('find-kiosk')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFocusSearch = () => {
    document.getElementById('find-kiosk')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => searchInputRef.current?.focus(), 400);
  };

  return (
    <div id="home" className="min-h-screen bg-white text-neutral-950">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-2.5">
            <img
              src="/kixcleen-logo.png"
              alt="KixCleen"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-display text-base font-bold tracking-[0.12em] uppercase">
              KixCleen
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wider text-neutral-600 uppercase">
            <a href="#home" className="text-neutral-950 hover:text-neutral-600">
              Home
            </a>
            <a href="#find-kiosk" className="hover:text-neutral-950">
              Find a Kiosk
            </a>
            <a href="#how-it-works" className="hover:text-neutral-950">
              How It Works
            </a>
            <a href="#about" className="hover:text-neutral-950">
              About Us
            </a>
            <a href="#contact" className="hover:text-neutral-950">
              Contact Us
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleFocusSearch}
              aria-label="Search Kiosks"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:border-neutral-950"
            >
              <Search className="h-4 w-4" />
            </button>
            <a
              href="#find-kiosk"
              className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              Find a Kiosk
            </a>
            <Link
              to="/admin/login"
              className="rounded-full border border-neutral-200 px-3.5 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950"
            >
              Admin
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleFocusSearch}
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-950"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-neutral-100 bg-white px-4 pt-3 pb-6 md:hidden">
            <nav className="flex flex-col space-y-1 text-sm font-medium text-neutral-700">
              {[
                ['Home', '#home'],
                ['Find a Kiosk', '#find-kiosk'],
                ['How It Works', '#how-it-works'],
                ['Shoe Categories', '#categories'],
                ['About Us', '#about'],
                ['Locations', '#locations'],
                ['FAQ', '#faq'],
                ['Contact Us', '#contact'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 hover:bg-neutral-50"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-4">
              <a
                href="#find-kiosk"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 rounded-full bg-neutral-950 py-2.5 text-center text-xs font-medium text-white"
              >
                Find a Kiosk
              </a>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-neutral-200 px-4 py-2.5 text-xs font-medium text-neutral-700"
              >
                Admin
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION (Sonique Reference Layout) */}
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8">
        <div className="text-center">
          <p className="font-display text-lg font-normal text-neutral-800 sm:text-2xl">
            Minimal Design, Clean Shoes for All
          </p>
          <h1 className="font-display mt-1 select-none text-[15vw] leading-[0.86] font-bold tracking-[-0.04em] text-neutral-950 sm:text-[13.5vw] lg:text-[156px]">
            KixCleen
          </h1>
        </div>

        <div className="mt-6 grid grid-cols-1 items-end gap-10 lg:-mt-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-4 lg:pb-4">
            <div className="space-y-5">
              <p className="max-w-xs text-xs leading-relaxed font-medium tracking-[0.12em] text-neutral-700 uppercase">
                SELF-SERVICE SHOE CLEANING KIOSKS. DROP IN YOUR PAIR, PICK A CYCLE, AND WALK OUT FRESH IN MINUTES.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="#find-kiosk"
                  className="rounded-full bg-neutral-950 px-6 py-3 text-xs font-medium text-white transition hover:bg-neutral-800"
                >
                  Find a Kiosk
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-xs font-medium text-neutral-900 transition hover:border-neutral-950"
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex flex-col items-start gap-2">
                <a
                  href="#categories"
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-[11px] font-medium tracking-wider text-neutral-800 uppercase transition hover:border-neutral-950"
                >
                  LEATHER SHOES
                </a>
                <a
                  href="#categories"
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-[11px] font-medium tracking-wider text-neutral-800 uppercase transition hover:border-neutral-950"
                >
                  EVERYDAY SNEAKERS
                </a>
                <a
                  href="#categories"
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-[11px] font-medium tracking-wider text-neutral-800 uppercase transition hover:border-neutral-950"
                >
                  UV &amp; WARM DRYER
                </a>
              </div>

              <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 shadow-inner">
                <div className="h-8 w-8 rounded-full border border-neutral-300 bg-white" />
              </div>
            </div>
          </div>

          {/* Center Column: Natural Footwear Showcase (Seamless Background) */}
          <div className="order-1 flex flex-col items-center lg:order-2 lg:col-span-5">
            <div className="relative flex w-full flex-col items-center">
              <div className="relative flex h-[280px] w-full max-w-[420px] sm:h-[330px] items-center justify-center">
                <img
                  src={currentHero.cutout}
                  alt={currentHero.label}
                  className="max-h-[240px] sm:max-h-[280px] w-auto object-contain transition-transform duration-500 hover:scale-105 drop-shadow-[0_20px_24px_rgba(0,0,0,0.12)]"
                />
                {/* Natural Ground Contact Shadow */}
                <div className="absolute bottom-2 h-4 w-3/4 rounded-full bg-neutral-900/10 blur-lg pointer-events-none" />
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      idx === activeSlide
                        ? 'bg-neutral-950 text-white shadow-2xs'
                        : 'border border-neutral-200 text-neutral-600 hover:border-neutral-950 hover:text-neutral-950'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: D-Shaped Showcase & Short Copy */}
          <div className="order-3 space-y-5 lg:col-span-3 lg:pb-4">
            <div className="mx-auto lg:mx-0 h-44 w-44 overflow-hidden rounded-tl-none rounded-tr-[88px] rounded-br-[88px] rounded-bl-[88px] border border-neutral-200 bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=85"
                alt="Clean white sneakers"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-lg font-bold text-neutral-950">
                Browse our kiosks
              </h2>
              <p className="text-xs leading-relaxed text-neutral-600">
                {onlineCount} of {kiosks.length} registered kiosks are online now. Find a machine near you, check its status, and clean your shoes on the spot.
              </p>
              <a
                href="#find-kiosk"
                className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-neutral-950 underline underline-offset-4"
              >
                Open map
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KIOSK LOCATOR SECTION */}
      <section
        id="find-kiosk"
        className="scroll-mt-16 border-t border-neutral-100 bg-neutral-50/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Find a Kiosk
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Search by city or street address. Click any pin or card to see hours and status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadKiosks}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, street, or kiosk name..."
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-9 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                aria-label="Filter by city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 focus:border-neutral-950 focus:outline-hidden"
              >
                <option value="ALL">All cities ({cities.length})</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 focus:border-neutral-950 focus:outline-hidden"
              >
                <option value="ALL">All statuses</option>
                <option value="online">Online</option>
                <option value="busy">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kiosk Cards */}
            <div className="order-2 lg:order-1 lg:col-span-5">
              <div className="mb-2.5 flex items-center justify-between text-xs text-neutral-500">
                <span>{filteredKiosks.length} locations</span>
                {(searchQuery || selectedCity !== 'ALL' || statusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCity('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="font-medium text-neutral-900 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="max-h-[540px] space-y-2.5 overflow-y-auto pr-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-2xl border border-neutral-200 bg-white"
                    />
                  ))
                ) : filteredKiosks.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    No kiosks match your search.
                  </div>
                ) : (
                  filteredKiosks.map((kiosk) => {
                    const isSelected = kiosk.id === selectedKioskId;
                    return (
                      <div
                        key={kiosk.id}
                        onClick={() => setSelectedKioskId(kiosk.id)}
                        className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${
                          isSelected
                            ? 'border-neutral-950 shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[11px] text-neutral-400">
                              {kiosk.id}
                            </span>
                            <h3 className="font-display text-sm font-bold text-neutral-950">
                              {kiosk.name}
                            </h3>
                          </div>
                          <StatusBadge status={kiosk.status} type="kiosk" size="sm" />
                        </div>

                        <p className="mt-1.5 text-xs text-neutral-600">
                          {kiosk.address}
                          {kiosk.city ? `, ${kiosk.city}` : ''}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-xs text-neutral-500">
                          <span>{kiosk.operatingHours || '8:00 AM to 10:00 PM'}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailModalKiosk(kiosk);
                            }}
                            className="font-medium text-neutral-950 hover:underline"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Interactive Map */}
            <div className="order-1 lg:order-2 lg:col-span-7">
              <KioskMap
                kiosks={mapItems}
                selectedKioskId={selectedKioskId}
                onSelectKiosk={(item) => setSelectedKioskId(item.id)}
                onViewDetails={(item) => {
                  const found = kiosks.find((k) => k.id === item.id);
                  if (found) setDetailModalKiosk(found);
                }}
                heightClass="h-[440px] lg:h-[570px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-16 border-t border-neutral-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Five steps at any KixCleen machine.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-neutral-200 p-5"
              >
                <span className="font-mono text-xs font-semibold text-neutral-400">
                  {item.step}
                </span>
                <h3 className="font-display mt-3 text-base font-bold text-neutral-950">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SHOE CLEANING CATEGORIES */}
      <section
        id="categories"
        className="scroll-mt-16 border-t border-neutral-100 bg-neutral-50/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Shoe Categories &amp; Cycles
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Two shoe categories and three timed cleaning options.
            </p>
          </div>

          {/* 2 Main Categories */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Leather Shoes */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=85"
                  alt="Leather Shoes"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-neutral-950">
                    Leather Shoes
                  </h3>
                  <span className="rounded-full border border-neutral-200 px-3 py-0.5 text-xs font-medium text-neutral-600">
                    Conditioning Care
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  Formal dress shoes, leather boots, and loafers. Cleaned with low-moisture foam and soft buffing.
                </p>
              </div>
            </div>

            {/* Other Shoes */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85"
                  alt="Other Shoes including sneakers, sports, school and canvas shoes"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-neutral-950">
                    Other Shoes
                  </h3>
                  <span className="rounded-full border border-neutral-200 px-3 py-0.5 text-xs font-medium text-neutral-600">
                    All Non-Leather
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  School shoes, sneakers, sports shoes, running shoes, and canvas footwear. Washed with gentle foam, sole scrubbing, and warm air.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Services + 2 Add-Ons */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex items-baseline justify-between">
                  <h4 className="font-display text-base font-bold text-neutral-950">
                    {s.name}
                  </h4>
                  <span className="font-display text-lg font-bold text-neutral-950">
                    {s.price}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-400">{s.time}</p>
                <p className="mt-2 text-xs text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-xs text-neutral-600">
            <div>
              <strong className="text-neutral-950">Optional Add-Ons:</strong> UV Light Bacterial Removal (+₱25) and Warm Air Dryer (+₱20).
            </div>
            <div>
              <strong className="text-neutral-950">Accepted Payments:</strong> Coins, Bills, GCash, and Maya QR.
            </div>
          </div>
        </div>
      </section>

      {/* 6. ABOUT US */}
      <section
        id="about"
        className="scroll-mt-16 border-t border-neutral-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                About KixCleen
              </h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                Washing shoes by hand takes hours of scrubbing and drying. Sudden rain, street dust, and daily commutes leave footwear damp and dirty when you need them most.
              </p>
              <p className="text-sm leading-relaxed text-neutral-600">
                KixCleen puts automated shoe-cleaning kiosks in malls, campuses, and transport hubs. Each kiosk pairs a enclosed cleaning chamber with live online status so you can find an open machine and clean your shoes in minutes.
              </p>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85"
                  alt="Sneaker care"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
                <img
                  src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=85"
                  alt="Footwear detail"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE KIXCLEEN */}
      <section
        id="benefits"
        className="scroll-mt-16 border-t border-neutral-100 bg-neutral-50/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Why KixCleen
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <h3 className="font-display text-base font-bold text-neutral-950">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. KIXCLEEN LOCATIONS */}
      <section
        id="locations"
        className="scroll-mt-16 border-t border-neutral-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                KixCleen Locations
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Registered public kiosks across the network.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-200 p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-neutral-400">
                      {kiosk.id}
                    </span>
                    <StatusBadge status={kiosk.status} type="kiosk" size="sm" />
                  </div>
                  <h3 className="font-display mt-2 text-base font-bold text-neutral-950">
                    {kiosk.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    {kiosk.address}
                    {kiosk.city ? `, ${kiosk.city}` : ''}
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    {kiosk.operatingHours || '8:00 AM to 10:00 PM'}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-neutral-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleSelectLocationCard(kiosk)}
                    className="rounded-full bg-neutral-950 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                  >
                    Show on map
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalKiosk(kiosk)}
                    className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-950"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section
        id="faq"
        className="scroll-mt-16 border-t border-neutral-100 bg-neutral-50/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Frequently Asked Questions
          </h2>

          <div className="mt-8 space-y-2.5">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-neutral-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-display text-sm font-bold text-neutral-950">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180 text-neutral-950' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 pt-3 pb-4 text-xs leading-relaxed text-neutral-600">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. ORDER & CONTACT FORM */}
      <section
        id="contact"
        className="scroll-mt-16 border-t border-neutral-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 rounded-3xl border border-neutral-200 bg-neutral-50/70 p-6 sm:p-12 lg:grid-cols-12">
            {/* Left: Explanatory Copy */}
            <div className="lg:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-800">
                Direct Orders &amp; Inquiries
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                Order Service or Request a Kiosk in Zamboanga City
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-neutral-600">
                Want to book a shoe cleaning service, place a dedicated KixCleen machine at your building or store, or inquire about vending units in Zamboanga City?
              </p>
              <p className="text-xs text-neutral-500">
                Submit your details below. Our Zamboanga operations manager will follow up with you directly.
              </p>

              <div className="pt-4 border-t border-neutral-200/80 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>Main Coverage: Zamboanga City &amp; Western Mindanao Hubs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span>Typical response time: Under 2 hours during business hours</span>
                </div>
              </div>
            </div>

            {/* Right: Interactive Order Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
                {inqSuccess ? (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-neutral-950">
                      Request Received!
                    </h3>
                    <p className="mx-auto max-w-md text-xs leading-relaxed text-neutral-600">
                      {inqSuccess}
                    </p>
                    <button
                      type="button"
                      onClick={() => setInqSuccess(null)}
                      className="mt-4 rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    {inqError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                        {inqError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={inqName}
                          onChange={(e) => setInqName(e.target.value)}
                          placeholder="e.g. Maria Santos"
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Mobile / Phone <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={inqPhone}
                          onChange={(e) => setInqPhone(e.target.value)}
                          placeholder="0917-000-0000"
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={inqEmail}
                          onChange={(e) => setInqEmail(e.target.value)}
                          placeholder="maria@example.com"
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Preferred Zamboanga Location
                        </label>
                        <select
                          value={inqLocation}
                          onChange={(e) => setInqLocation(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        >
                          <option value="KCC Mall de Zamboanga (Camino Nuevo)">KCC Mall de Zamboanga (Camino Nuevo)</option>
                          <option value="SM City Mindpro (La Purisima)">SM City Mindpro (La Purisima)</option>
                          <option value="Paseo del Mar Promenade (Zone IV)">Paseo del Mar Promenade (Zone IV)</option>
                          <option value="Yubenco Star Mall (Putik)">Yubenco Star Mall (Putik)</option>
                          <option value="WMSU Campus / Baliwasan">WMSU Campus / Baliwasan</option>
                          <option value="Zamboanga Int'l Airport (Canelar)">Zamboanga Int'l Airport (Canelar)</option>
                          <option value="CityMall Tetuan (Don Alfaro)">CityMall Tetuan (Don Alfaro)</option>
                          <option value="Santa Maria Commercial Center">Santa Maria Commercial Center</option>
                          <option value="Other Location in Zamboanga City">Other Location in Zamboanga City</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Inquiry / Order Type
                        </label>
                        <select
                          value={inqType}
                          onChange={(e) => setInqType(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        >
                          <option value="Order Shoe Cleaning Service">Order Shoe Cleaning Service</option>
                          <option value="Request Kiosk Placement at My Property">Request Kiosk Placement at My Property</option>
                          <option value="Kiosk Machine Purchase / Franchise">Kiosk Machine Purchase / Franchise</option>
                          <option value="Commercial Fleet / Event Service">Commercial Fleet / Event Service</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700">
                          Estimated Shoe Quantity
                        </label>
                        <select
                          value={inqPairs}
                          onChange={(e) => setInqPairs(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                        >
                          <option value="1-2 Pairs">1-2 Pairs</option>
                          <option value="3-5 Pairs">3-5 Pairs</option>
                          <option value="6-10 Pairs">6-10 Pairs</option>
                          <option value="Batch / Wholesale (10+ Pairs)">Batch / Wholesale (10+ Pairs)</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700">
                        Notes or Specific Requests (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={inqMessage}
                        onChange={(e) => setInqMessage(e.target.value)}
                        placeholder="Tell us about your shoes (e.g., leather dress shoes, white sneakers) or proposed machine placement..."
                        className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2 text-xs text-neutral-900 focus:border-neutral-950 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inqSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {inqSubmitting ? 'Submitting Request...' : 'Submit Order Request'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/kixcleen-logo.png"
                alt="KixCleen"
                className="h-7 w-7 rounded-md object-contain"
              />
              <span className="font-display text-sm font-bold tracking-[0.12em] uppercase">
                KixCleen
              </span>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-neutral-600">
              <a href="#home" className="hover:text-neutral-950">
                Home
              </a>
              <a href="#find-kiosk" className="hover:text-neutral-950">
                Find a Kiosk
              </a>
              <a href="#how-it-works" className="hover:text-neutral-950">
                How It Works
              </a>
              <a href="#categories" className="hover:text-neutral-950">
                Categories
              </a>
              <a href="#about" className="hover:text-neutral-950">
                About
              </a>
              <a href="#contact" className="hover:text-neutral-950">
                Contact
              </a>
              <Link to="/setup-account" className="hover:text-neutral-950">
                Buyer Setup
              </Link>
              <Link to="/admin/login" className="hover:text-neutral-950">
                Admin
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-100 pt-6 text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} KixCleen. All rights reserved.
          </div>
        </div>
      </footer>

      {/* KIOSK DETAILS MODAL */}
      {detailModalKiosk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">
                    {detailModalKiosk.id}
                  </span>
                  <StatusBadge status={detailModalKiosk.status} type="kiosk" size="sm" />
                </div>
                <h3 className="font-display mt-1 text-lg font-bold text-neutral-950">
                  {detailModalKiosk.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalKiosk(null)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-600">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <span>
                  {detailModalKiosk.address}
                  {detailModalKiosk.city ? `, ${detailModalKiosk.city}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
                <span>{detailModalKiosk.operatingHours || '8:00 AM to 10:00 PM'}</span>
              </div>

              {detailModalKiosk.servicesOffered &&
                detailModalKiosk.servicesOffered.length > 0 && (
                  <div className="pt-2">
                    <p className="text-neutral-400">Available cycles</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {detailModalKiosk.servicesOffered.map((srv) => (
                        <span
                          key={srv}
                          className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-neutral-700"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              {detailModalKiosk.hasValidCoordinates && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${detailModalKiosk.latitude}&mlon=${detailModalKiosk.longitude}#map=17/${detailModalKiosk.latitude}/${detailModalKiosk.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Open in Maps
                </a>
              )}
              <button
                type="button"
                onClick={() => setDetailModalKiosk(null)}
                className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
