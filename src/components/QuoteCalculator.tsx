import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Trash2, Calculator, Download, BookOpen,
  Maximize, Layers, FileText, Copy, FileStack,
  Palette, CheckSquare, Settings, PenTool, Book,
  Cpu, Percent, PlusCircle, Receipt, Wallet,
  User, UserCircle2, Shield, Users, Phone, Mail, Hash, MapPin, Calendar,
  Bookmark, Printer, Palette as PaletteIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { supabase } from '@/integrations/supabase/client';
import odohlogo from '@/assets/Odoh.jpg';
// 🔒 Maintenance mode – set to false to enable the app
const MAINTENANCE_MODE = false;

// Database types
interface PaperCost {
  id: string;
  paper_type: string;
  size: string;
  cost_per_page: number;
}

interface TonerCost {
  id: string;
  color_type: string;
  size: string;
  cost_per_page: number;
}

interface CoverCost {
  id: string;
  cover_type: string;
  size: string;
  cost: number;
}

interface FinishingCost {
  id: string;
  page_range_min: number;
  page_range_max: number | null;
  cost: number;
}

interface PackagingCost {
  id: string;
  paper_size: string;
  min_pages: number;
  max_pages: number;
  cost: number;
}

interface BHRSetting {
  id: string;
  rate_per_hour: number;
}



interface AdditionalService {
  id: string;
  service_name: string;
  cost: number;
  is_default?: boolean;
}

interface ProfitMargin {
  id: string;
  copies_min: number;
  copies_max: number | null;
  margin_percentage_1: number;
  margin_percentage_2: number | null;
}

interface OtherService {
  description: string;
  cost: number;
}

interface Quote {
  bookSize: string;
  paperType: string;
  interiorType: string;
  bwPages?: number;      
  colourPages?: number;  
  coverType: string;
  includeVAT: boolean;
hardCoverPrice?: number;
foldedCoverPrice?: number;
  pageCount: number;
  copies: number;
  includeDesign: boolean;
  includeISBN: boolean;
  includeBHR: boolean;
  applyBulkDiscount: number;
  profitMargin: number;
  others: OtherService[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerOrderNo?: string;
  customerDelivery?: string;
  customerAddress?: string;
  customerBookTitle?: string;
  staffName?: string;
  staffId?: string;
  bhrHours?: number;
  finishingCostOverride?: number;
  extraCost: number;
}

interface Calculations {
  vat: number;
  baseBeforeTen: any;
  paperCost: number;
  tonerCost: number;
  coverCost: number;
  finishingCost: number;
  packagingCost: number;
  bhrCost: number;
  designCost: number;
  isbnCost: number;
  othersCost: number;
  rawCost: number;
  profitAmount: number;

 
}

export const QuoteCalculator: React.FC = () => {
  const { toast } = useToast();

  // 🔒 Block site during maintenance
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">🚧 Site Temporarily Unavailable</h1>
          <p className="text-lg">
            This system is currently under maintenance.
          </p>
          <p className="text-sm opacity-70">
            Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // State for all costs from database
  const [paperCosts, setPaperCosts] = useState<PaperCost[]>([]);
  const [tonerCosts, setTonerCosts] = useState<TonerCost[]>([]);
  const [coverCosts, setCoverCosts] = useState<CoverCost[]>([]);
  const [finishingCosts, setFinishingCosts] = useState<FinishingCost[]>([]);
  const [packagingCosts, setPackagingCosts] = useState<PackagingCost[]>([]);
  const [bhrSettings, setBhrSettings] = useState<BHRSetting[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [profitMargins, setProfitMargins] = useState<ProfitMargin[]>([]);
  

  // Quote state - no default values for page count, copies and profit margin
  const [quote, setQuote] = useState<Quote>({
    bookSize: '',
    paperType: '',
    interiorType: '',
    coverType: '',
    pageCount: 0,
    copies: 0,
    includeDesign: false,
    includeISBN: false,
    includeBHR: false,
    applyBulkDiscount: 0,
    profitMargin: 0,
    others: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerOrderNo: '',
    customerDelivery: '',
    customerAddress: '',
    customerBookTitle: '',
    staffName: '',
    staffId: '',
    bhrHours: 0,
    includeVAT: false,
hardCoverPrice: 0,
foldedCoverPrice: 0,
extraCost: 0,
  });

  // State for profit margin two-way binding and empty field inputs
  const [profitMarginPercent, setProfitMarginPercent] = useState<string>('');
  const [profitMarginNGN, setProfitMarginNGN] = useState<string>('');
  const [copiesValue, setCopiesValue] = useState<string>('');
  
const [pageCountValue, setPageCountValue] = useState<string>('');
  const [bulkDiscountEnabled, setBulkDiscountEnabled] = useState<boolean>(false);
  const [bulkDiscountValue, setBulkDiscountValue] = useState<string>('');
  


  // New other service form
  const [newOther, setNewOther] = useState<OtherService>({
    description: '',
    cost: 0
  });

  // Load all costs from database
  useEffect(() => {
    loadAllCosts();
  }, []);

  const loadAllCosts = async () => {
    try {
      const [paperRes, tonerRes, coverRes, finishingRes, packagingRes, bhrRes, additionalRes] = await Promise.all([
        supabase.from('paper_costs').select('*'),
        supabase.from('toner_costs').select('*'),
        supabase.from('cover_costs').select('*'),
        supabase.from('finishing_costs').select('*'),
        supabase.from('packaging_costs').select('*'),
        supabase.from('bhr_config').select('*'),
        supabase.from('additional_services').select('*')
      ]);

      if (paperRes.data) setPaperCosts(paperRes.data);
      if (tonerRes.data) setTonerCosts(tonerRes.data.map((t: any) => ({ id: t.id, color_type: t.type, size: t.size, cost_per_page: t.cost_per_page })));
      if (coverRes.data) setCoverCosts(coverRes.data);
      if (finishingRes.data) setFinishingCosts(finishingRes.data);
      if (packagingRes.data) setPackagingCosts(packagingRes.data);
      if (bhrRes.data) setBhrSettings(bhrRes.data.map((b: any) => ({ id: b.id, rate_per_hour: Number(b.rate_per_hour) })));
      if (additionalRes.data) setAdditionalServices(additionalRes.data);
    } catch (error) {
      console.error('Error loading costs:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing data",
        variant: "destructive",
      });
    }
  };

  // Calculate all costs
  const calculations: Calculations = React.useMemo(() => {
   
    const safe = (n: any) => (isNaN(n) || n === undefined || n === null ? 0 : n);

    const paperCost = paperCosts.find(p => 
      p.paper_type === quote.paperType && p.size === quote.bookSize
    )?.cost_per_page || 0;

    const bwToner = tonerCosts.find(t => 
  t.color_type === "B/W" && t.size === quote.bookSize
)?.cost_per_page || 0;

const colourToner = tonerCosts.find(t => 
  t.color_type === "Colour" && t.size === quote.bookSize
)?.cost_per_page || 0;

   const baseCoverCost = coverCosts.find(c => 
  c.cover_type === quote.coverType && c.size === quote.bookSize
)?.cost || 0;

const manualHardCost = quote.hardCoverPrice || 0;
const manualFoldedCost = quote.foldedCoverPrice || 0;

const coverCost =
  quote.coverType === "Hard" ? manualHardCost :
  quote.coverType === "Folded" ? manualFoldedCost :
  quote.coverType === "Hard+Folded" ? manualHardCost + manualFoldedCost :
  baseCoverCost;

    const finishingCost = finishingCosts.find(f => 
      quote.pageCount >= f.page_range_min && 
      (f.page_range_max === null || quote.pageCount <= f.page_range_max)
    )?.cost || 0;

    console.log("Quote book size:", quote.bookSize);
console.log("Quote page count:", quote.pageCount);
console.log("Packaging costs:", packagingCosts);

    const packaging = packagingCosts.find(
  p =>
    p.paper_size === quote.bookSize &&
    quote.pageCount >= p.min_pages &&
    quote.pageCount <= p.max_pages
);

const packagingCost = packaging?.cost ?? 0;
console.log("Matched packaging:", packaging);

    const bhrCost = quote.includeBHR && quote.bhrHours ? quote.bhrHours : 0;

    const designService = additionalServices.find(s => s.service_name === 'Design');
    const isbnService = additionalServices.find(s => s.service_name === 'ISBN');
    
    const designCost = quote.includeDesign ? (designService?.cost || 15000) : 0;
    const isbnCost = quote.includeISBN ? (isbnService?.cost || 10000) : 0;
    const othersCost = quote.others.reduce((sum, item) => sum + item.cost, 0);

    const totalPaperCost = paperCost * quote.pageCount * quote.copies;
    let totalTonerCost = 0;

if (quote.interiorType === "B/W & Colour") {

  const bwPages = quote.bwPages || 0;
  const colourPages = quote.colourPages || 0;

  totalTonerCost =
    (bwPages * bwToner * quote.copies) +
    (colourPages * colourToner * quote.copies);

} else {
  // Original logic for single-type printing
  const tonerCost = tonerCosts.find(t =>
    t.color_type === quote.interiorType && t.size === quote.bookSize
  )?.cost_per_page || 0;

  totalTonerCost = safe(tonerCost) * safe(quote.pageCount) * safe(quote.copies);
}

    const totalCoverCost = safe(coverCost) *safe(quote.copies);
    const totalFinishingCost = safe(finishingCost) * safe(quote.copies);
    const totalPackagingCost = safe(packagingCost) * safe(quote.copies);

    const rawCost = safe(totalPaperCost) + safe(totalTonerCost) + safe(totalCoverCost) + safe(totalFinishingCost) + safe(totalPackagingCost) ;
    const profitAmount = (safe(rawCost) * safe(quote.profitMargin)) / 100;
    const vat = quote.includeVAT
  ? (rawCost + designCost + isbnCost + bhrCost + othersCost) * 0.075
  : 0;
    

  const baseBeforeTen =  safe(rawCost) + safe(profitAmount) +  safe(designCost) +  safe(isbnCost) +  safe(bhrCost) +  safe(othersCost) + vat + quote.extraCost -  safe(quote.applyBulkDiscount);



    return {
    paperCost: safe(totalPaperCost),
    tonerCost: safe(totalTonerCost),
    coverCost: safe(totalCoverCost),
    finishingCost: safe(totalFinishingCost),
    packagingCost: safe(totalPackagingCost),
    bhrCost: safe(bhrCost),
    designCost: safe(designCost),
    isbnCost: safe(isbnCost),
    othersCost: safe(othersCost),
    rawCost: safe(rawCost),
    profitAmount: safe(profitAmount),
     vat: safe(vat),
       baseBeforeTen: safe(baseBeforeTen),
  
  

  };

  }, [quote, paperCosts, tonerCosts, coverCosts, finishingCosts, packagingCosts, bhrSettings, additionalServices]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle profit margin percentage change
  const handleProfitMarginPercentChange = (value: string) => {
    setProfitMarginPercent(value);
    const numericValue = parseFloat(value) || 0;
    setQuote(prev => ({...prev, profitMargin: numericValue}));
    
    // Auto-calculate NGN amount
    if (calculations.rawCost > 0) {
      const ngnAmount = (calculations.rawCost * numericValue) / 100;
      setProfitMarginNGN(ngnAmount.toString());
    }
  };

  // Handle profit margin NGN amount change
  const handleProfitMarginNGNChange = (value: string) => {
    setProfitMarginNGN(value);
    const numericValue = parseFloat(value) || 0;
    
    // Auto-calculate percentage
    if (calculations.rawCost > 0) {
      const percentage = (numericValue / calculations.rawCost) * 100;
      setProfitMarginPercent(percentage.toFixed(2));
      setQuote(prev => ({...prev, profitMargin: percentage}));
    }
  };

  // Handle copies change
  const handleCopiesChange = (value: string) => {
    setCopiesValue(value);
    const numericValue = parseInt(value) || 0;
    setQuote(prev => ({...prev, copies: numericValue}));
  };

  // Handle page count change
  const handlePageCountChange = (value: string) => {
    setPageCountValue(value);
    const numericValue = parseInt(value) || 0;
    setQuote(prev => ({...prev, pageCount: numericValue}));
  };

  // Handle bulk discount change
  const handleBulkDiscountChange = (value: string) => {
    setBulkDiscountValue(value);
    const numericValue = parseFloat(value) || 0;
    setQuote(prev => ({...prev, applyBulkDiscount: numericValue}));
  };

  // Handle bulk discount toggle
  const handleBulkDiscountToggle = (checked: boolean) => {
    setBulkDiscountEnabled(checked);
    if (!checked) {
      setBulkDiscountValue('');
      setQuote(prev => ({...prev, applyBulkDiscount: 0}));
    }
  };

  const addOtherService = () => {
    if (newOther.description && newOther.cost > 0) {
      setQuote(prev => ({
        ...prev,
        others: [...prev.others, newOther]
      }));
      setNewOther({ description: '', cost: 0 });
    }
  };

  const removeOtherService = (index: number) => {
    setQuote(prev => ({
      ...prev,
      others: prev.others.filter((_, i) => i !== index)
    }));
  };

  const generatePDF = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    // Input validation
    if (!quote.bookSize || !quote.paperType || !quote.interiorType || !quote.coverType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Configure pdfMake with fonts
      pdfMake.vfs = pdfFonts.vfs;

      // Generate quote details
      const quotationId = `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      const fileName = `OdohPrints-Quote-${quotationId}.pdf`;
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'numeric',
        year: 'numeric'
      });

      // Calculate printing cost total (includes BHR and Profit Margin internally)
      const printingCostSubTotal = calculations.paperCost + calculations.tonerCost + calculations.coverCost + calculations.finishingCost + calculations.packagingCost + calculations.bhrCost + calculations.profitAmount + calculations.othersCost + calculations.vat ;
       
      const printingCostTotal = printingCostSubTotal;
      // Calculate additional services total (excluding BHR and Profit Margin)
      const additionalServicesTotal = calculations.designCost + calculations.isbnCost  - quote.applyBulkDiscount;

      
    // DOCUMENT DEFINITION
    // =====================================================

    const docDefinition: any = {

      pageSize: 'A4',

      pageMargins: [40, 45, 40, 45],


      // ===================================================
      // CONTENT
      // ===================================================

      content: [

        // =================================================
        // HEADER
        // =================================================

        {
          columns: [

            // ---------------------------------------------
            // COMPANY INFORMATION
            // ---------------------------------------------

            {
              width: '*',

              stack: [

                {
                  text: 'THE ODOH PUBLISHERS',

                  fontSize: 22,

                  bold: true,

                  color: '#102A56'
                },

                {
                  text:
                    'Shop 7 Futureview Plaza along Yakowa\n' +
                    'Expressway, Mahuta,\n' +
                    'Kaduna State, Nigeria.',

                  fontSize: 9,

                  color: '#333333',

                  margin: [0, 5, 0, 0]
                },

                {
                  text: 'Phone: 07025665328',

                  fontSize: 9,

                  margin: [0, 4, 0, 0]
                },

                {
                  text:
                    'Email: the.odoh.publishers.ltd@gmail.com',

                  fontSize: 9
                }

              ]
            },


            // ---------------------------------------------
            // QUOTATION TITLE
            // ---------------------------------------------

            {
              
              width: 150,

              stack: [
                

                {
                  
                  text: 'THE ODOH PUBLISHERS',

                  fontSize: 22,

                  bold: true,

                  color: '#102A56'
                },

                {
                  text:
                    'Shop 7 Futureview Plaza along Yakowa\n' +
                    'Expressway, Mahuta,\n' +
                    'Kaduna State, Nigeria.',

                  fontSize: 9,

                  color: '#333333',

                  margin: [0, 5, 0, 0]
                },

                {
                  text: 'Phone: 07025665328',

                  fontSize: 9,

                  margin: [0, 4, 0, 0]
                },

                {
                  text:
                    'Email: the.odoh.publishers.ltd@gmail.com',

                  fontSize: 9
                }

              ]
            }

          ],
          

          margin: [0, 0, 0, 18]
        },


        // =================================================
        // CLIENT + QUOTATION INFORMATION
        // =================================================

        {
          table: {

            widths: ['*', '*'],

            body: [

              // -------------------------------------------
              // HEADERS
              // -------------------------------------------

              [

                {
                  text: 'TO',

                  bold: true,

                  color: '#102A56',

                  fontSize: 12,

                  fillColor: '#EEF3FA',

                  margin: [8, 7, 8, 7]
                },

                {
                  text: 'QUOTATION DETAILS',

                  bold: true,

                  color: '#102A56',

                  fontSize: 12,

                  fillColor: '#EEF3FA',

                  margin: [8, 7, 8, 7]
                }

              ],


              // -------------------------------------------
              // INFORMATION
              // -------------------------------------------

              [

                {
                  stack: [

                    {
                      text:
                        `Client's Name: ${
                          quote.customerName || '________________'
                        }`,

                      fontSize: 9
                    },

                    {
                      text:
                        `Phone: ${
                          quote.customerPhone || '________________'
                        }`,

                      fontSize: 9,

                      margin: [0, 4, 0, 0]
                    },

                    {
                      text:
                        `Email: ${
                          quote.customerEmail || '________________'
                        }`,

                      fontSize: 9,

                      margin: [0, 4, 0, 0]
                    },

                    ...(quote.customerAddress
                      ? [
                          {
                            text:
                              `Address: ${quote.customerAddress}`,

                            fontSize: 9,

                            margin: [0, 4, 0, 0]
                          }
                        ]
                      : []),

                    ...(quote.customerBookTitle
                      ? [
                          {
                            text:
                              `Book Title: ${quote.customerBookTitle}`,

                            fontSize: 9,

                            margin: [0, 4, 0, 0]
                          }
                        ]
                      : [])

                  ],

                  margin: [8, 8, 8, 8]
                },


                {
                  stack: [

                    {
                      text:
                        `Quotation No: ${quotationId}`,

                      fontSize: 9
                    },

                    {
                      text:
                        `Date: ${currentDate}`,

                      fontSize: 9,

                      margin: [0, 4, 0, 0]
                    },

                    {
                      text:
                        `Job Number: ${
                          quote.customerOrderNo ||
                          '________________'
                        }`,

                      fontSize: 9,

                      margin: [0, 4, 0, 0]
                    },

                    {
                      text:
                        `Prepared by: ${
                          quote.staffName ||
                          '________________'
                        }`,

                      fontSize: 9,

                      margin: [0, 4, 0, 0]
                    },

                    ...(quote.staffId
                      ? [
                          {
                            text:
                              `Staff ID: ${quote.staffId}`,

                            fontSize: 9,

                            margin: [0, 4, 0, 0]
                          }
                        ]
                      : [])

                  ],

                  margin: [8, 8, 8, 8]
                }

              ]

            ]

          },

          layout: {

            hLineWidth: () => 0.6,

            vLineWidth: () => 0.6,

            hLineColor: () => '#CBD5E1',

            vLineColor: () => '#CBD5E1'

          },

          margin: [0, 0, 0, 18]
        },


        // =================================================
        // BOOK SPECIFICATIONS
        // =================================================

        {
          text: 'BOOK SPECIFICATIONS',

          style: 'sectionHeader'
        },


        {
          table: {

            widths: ['*', '*'],

            body: [

              [
                {
                  text: 'Book Size',

                  bold: true
                },

                {
                  text: quote.bookSize || '-'
                }
              ],

              [
                {
                  text: 'Cover Type',

                  bold: true
                },

                {
                  text: quote.coverType || '-'
                }
              ],

              [
                {
                  text: 'Page Count',

                  bold: true
                },

                {
                  text: `${quote.pageCount || 0}`
                }
              ],

              [
                {
                  text: 'Copies',

                  bold: true
                },

                {
                  text: `${quote.copies || 0}`
                }
              ],

              [
                {
                  text: 'Paper Type',

                  bold: true
                },

                {
                  text: quote.paperType || '-'
                }
              ],

              [
                {
                  text: 'Interior Type',

                  bold: true
                },

                {
                  text: quote.interiorType || '-'
                }

              ]

            ]

          },

          layout: {

            hLineWidth: () => 0.5,

            vLineWidth: () => 0.5,

            hLineColor: () => '#CBD5E1',

            vLineColor: () => '#CBD5E1',

            paddingLeft: () => 7,

            paddingRight: () => 7,

            paddingTop: () => 6,

            paddingBottom: () => 6

          },

          margin: [0, 0, 0, 12]
        },


        // =================================================
        // PRINTING COST TOTAL
        // =================================================

        {
          table: {

            widths: ['*', 'auto'],

            body: [

              [

                {
                  text: 'PRINTING COST TOTAL',

                  bold: true,

                  color: 'white',

                  fillColor: '#102A56',

                  margin: [8, 8, 8, 8]
                },

                {
                  text: formatCurrency(printingCostTotal),

                  bold: true,

                  color: 'white',

                  fillColor: '#102A56',

                  alignment: 'right',

                  margin: [8, 8, 8, 8]
                }

              ]

            ]

          },

          layout: 'noBorders',

          margin: [0, 0, 0, 18]
        },


        // =================================================
        // ADDITIONAL SERVICES
        // =================================================

        ...(quote.includeDesign ||
        quote.includeISBN ||
        quote.others.length > 0

          ? [

              {
                text: 'ADDITIONAL SERVICES',

                style: 'sectionHeader'
              },


              {
                table: {

                  widths: ['*', 'auto'],

                  body: [

                    // -------------------------------------
                    // DESIGN
                    // -------------------------------------

                    ...(quote.includeDesign

                      ? [

                          [

                            {
                              text: 'Design'
                            },

                            {
                              text:
                                formatCurrency(
                                  calculations.designCost
                                ),

                              alignment: 'right'
                            }

                          ]

                        ]

                      : []),


                    // -------------------------------------
                    // ISBN
                    // -------------------------------------

                    ...(quote.includeISBN

                      ? [

                          [

                            {
                              text: 'ISBN'
                            },

                            {
                              text:
                                formatCurrency(
                                  calculations.isbnCost
                                ),

                              alignment: 'right'
                            }

                          ]

                        ]

                      : []),


                    // -------------------------------------
                    // OTHER SERVICES
                    // -------------------------------------

                    ...quote.others.map(item => [

                      {
                        text: item.description
                      },

                      {
                        text:
                          formatCurrency(item.cost),

                        alignment: 'right'
                      }

                    ])

                  ]

                },

                layout: {

                  hLineWidth: () => 0.5,

                  vLineWidth: () => 0.5,

                  hLineColor: () => '#CBD5E1',

                  vLineColor: () => '#CBD5E1',

                  paddingLeft: () => 7,

                  paddingRight: () => 7,

                  paddingTop: () => 6,

                  paddingBottom: () => 6

                },

                margin: [0, 0, 0, 10]
              },


              // -------------------------------------------
              // ADDITIONAL SERVICES TOTAL
              // -------------------------------------------

              {
                table: {

                  widths: ['*', 'auto'],

                  body: [

                    [

                      {
                        text:
                          'ADDITIONAL SERVICES TOTAL',

                        bold: true,

                        color: 'white',

                        fillColor: '#102A56',

                        margin: [8, 8, 8, 8]
                      },

                      {
                        text:
                          formatCurrency(
                            additionalServicesTotal
                          ),

                        bold: true,

                        color: 'white',

                        fillColor: '#102A56',

                        alignment: 'right',

                        margin: [8, 8, 8, 8]
                      }

                    ]

                  ]

                },

                layout: 'noBorders',

                margin: [0, 0, 0, 18]
              }

            ]

          : []),


        // =================================================
        // FINAL QUOTATION
        // =================================================

        {
          table: {

            widths: ['*', 'auto'],

            body: [

              [

                {
                  text: 'FINAL QUOTATION',

                  fontSize: 16,

                  bold: true,

                  color: 'white',

                  fillColor: '#0A1D3A',

                  margin: [12, 12, 12, 12]
                },

                {
                  text:
                    formatCurrency(
                      calculations.baseBeforeTen
                    ),

                  fontSize: 16,

                  bold: true,

                  color: 'white',

                  fillColor: '#0A1D3A',

                  alignment: 'right',

                  margin: [12, 12, 12, 12]
                }

              ]

            ]

          },

          layout: 'noBorders',

          margin: [0, 5, 0, 20]
        },


        // =================================================
        // TERMS & CONDITIONS
        // =================================================

        {
          text: 'TERMS & CONDITIONS',

          style: 'sectionHeader'
        },


        {
          stack: [

            {
              text:
                '1. This quotation is official and legal property of The Odoh Publishers Ltd.',

              fontSize: 8
            },

            {
              text:
                '2. This quotation is valid for 30 days following the date specified.',

              fontSize: 8,

              margin: [0, 4, 0, 0]
            }

          ],

          margin: [0, 0, 0, 15]
        },


        // =================================================
        // SIGNATURE
        // =================================================

        {
          columns: [

            {
              text:
                'Signature for Quotation Acceptance\n\n' +
                '____________________________',

              fontSize: 9
            },

            {
              text:
                'Prepared by\n\n' +
                '____________________________',

              fontSize: 9,

              alignment: 'right'
            }

          ],

          margin: [0, 0, 0, 18]
        },


        // =================================================
        // ACCOUNT DETAILS
        // =================================================

        {
          table: {

            widths: ['*'],

            body: [

              [
                {
                  text:
                    'THE ODOH PUBLISHERS ACCOUNT DETAILS',

                  bold: true,

                  color: 'white',

                  fillColor: '#102A56',

                  alignment: 'center',

                  margin: [8, 8, 8, 8]
                }
              ],

              [
                {
                  text:
                    'Bank Name: MoniePoint',

                  alignment: 'center',

                  fontSize: 9,

                  margin: [5, 5, 5, 2]
                }
              ],

              [
                {
                  text:
                    'Account No: 6238593555',

                  alignment: 'center',

                  fontSize: 9,

                  margin: [5, 2, 5, 2]
                }
              ],

              [
                {
                  text:
                    'Account Name: The Odoh Publishers Ltd',

                  alignment: 'center',

                  fontSize: 9,

                  margin: [5, 2, 5, 7]
                }
              ]

            ]

          },

          layout: {

            hLineWidth: () => 0.6,

            vLineWidth: () => 0.6,

            hLineColor: () => '#CBD5E1',

            vLineColor: () => '#CBD5E1'

          },

          margin: [0, 0, 0, 15]
        },


        // =================================================
        // FOOTER
        // =================================================

        {
          canvas: [

            {
              type: 'line',

              x1: 0,

              y1: 0,

              x2: 515,

              y2: 0,

              lineWidth: 1,

              lineColor: '#102A56'
            }

          ],

          margin: [0, 0, 0, 10]
        },


        {
          text:
            'Thank you for choosing The Odoh Publishers.',

          fontSize: 10,

          bold: true,

          color: '#102A56',

          alignment: 'center'
        }

      ],


      // ===================================================
      // STYLES
      // ===================================================

      styles: {

        sectionHeader: {

          fontSize: 12,

          bold: true,

          color: '#102A56',

          margin: [0, 6, 0, 7]

        }

      }

    };
      // Generate and download PDF
      pdfMake.createPdf(docDefinition).download(fileName);

      toast({
        title: "Success",
        description: "Quote PDF generated successfully!",
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-blue-light via-background to-royal-blue-light/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Admin Icon */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            {/* Admin icon at top right */}
            <Link to="/admin">
              <Button variant="outline" className="border-royal-blue text-royal-blue hover:bg-royal-blue-light">
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-royal-blue to-royal-blue-dark rounded-full mb-4 shadow-lg">
              <img src={odohlogo} alt="The Odoh Publishers" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-royal-blue to-royal-blue-dark bg-clip-text text-transparent mb-2">
              The Odoh Publishers
            </h1>
 <h2 className="text-4xl font-bold bg-gradient-to-r from-royal-blue to-royal-blue-dark bg-clip-text text-transparent mb-2">
             Staff Quote
            </h2>

            <p className="text-muted-foreground">Standard Quotation</p>
          </div>
        </div>

        {/* Main calculator layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column - Form */}
      <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Information */}
            <Card className="border-royal-blue/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-royal-blue to-royal-blue-dark text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 p-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="customerName" className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4" />
                      Customer Name
                    </Label>
                    <Input
                      id="customerName"
                      value={quote.customerName}
                      onChange={(e) => setQuote(prev => ({...prev, customerName: e.target.value}))}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone" className="flex items-center gap-2 mb-3">
                      <Phone className="w-4 h-4" />
                      Customer Phone
                    </Label>
                    <Input
                      id="customerPhone"
                      value={quote.customerPhone}
                      onChange={(e) => setQuote(prev => ({...prev, customerPhone: e.target.value}))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail" className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4" />
                      Customer Email
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={quote.customerEmail}
                      onChange={(e) => setQuote(prev => ({...prev, customerEmail: e.target.value}))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerOrderNo" className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4" />
                      Customer Order Number
                    </Label>
                    <Input
                      id="customerOrderNo"
                      value={quote.customerOrderNo}
                      onChange={(e) => setQuote(prev => ({...prev, customerOrderNo: e.target.value}))}
                      placeholder="Enter customer Order Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerBookTitle" className="flex items-center gap-2 mb-3">
                      <Book className="w-4 h-4" />
                      Customer Book Title
                    </Label>
                    <Input
                      id="customerBookTitle"
                      value={quote.customerBookTitle}
                      onChange={(e) => setQuote(prev => ({...prev, customerBookTitle: e.target.value}))}
                      placeholder="Enter customer Book Title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerAddress" className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4" />
                      Customer Address
                    </Label>
                    <Input
                      id="customerAddress"
                      value={quote.customerAddress}
                      onChange={(e) => setQuote(prev => ({...prev, customerAddress: e.target.value}))}
                      placeholder="Enter customer Address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerDelivery" className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4" />
                      Customer Delivery Date
                    </Label>
                    <Input
                    type="date"
                      id="customerDelivery"
                      value={quote.customerDelivery}
                      onChange={(e) => setQuote(prev => ({...prev, customerDelivery: e.target.value}))}
                      placeholder="Enter customer Delivery Date"
                    />
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* Staff Information */}
            <Card className="border-royal-blue/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-royal-blue to-royal-blue-dark text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 p-2">
                  <Users className="w-5 h-5" />
                  Staff Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="staffName" className="flex items-center gap-2 mb-3">
                      <UserCircle2 className="w-4 h-4" />
                      Prepared By (Staff Name)
                    </Label>
                    <Input
                      id="staffName"
                      value={quote.staffName}
                      onChange={(e) => setQuote(prev => ({...prev, staffName: e.target.value}))}
                      placeholder="Enter staff name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffId" className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4" />
                      Staff ID
                    </Label>
                    <Input
                      id="staffId"
                      value={quote.staffId}
                      onChange={(e) => setQuote(prev => ({...prev, staffId: e.target.value}))}
                      placeholder="Enter staff ID"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

           

           
</div>

          {/* Right Column - Services + Quote Breakdown */}
           <div className="lg:col-span-2 space-y-6">
            {/* =========================
    SERVICES
========================= */}
<Card className="border-royal-blue/20 shadow-lg">
  <CardHeader className="bg-gradient-to-r from-royal-blue to-royal-blue-dark text-white rounded-t-lg">
    <CardTitle className="flex items-center gap-2 p-2">
      <Settings className="w-5 h-5" />
      Services
    </CardTitle>
  </CardHeader>

  <CardContent className="p-6">

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* =================================
          EDITING SERVICES
      ================================== */}
      <div className="rounded-xl border border-royal-blue/20 bg-card p-5 shadow-sm">

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue-light text-royal-blue">
            <PenTool className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-base">
              Editing & Cover Services
            </h3>

            <p className="text-xs text-muted-foreground">
              Additional publishing and editing services
            </p>
          </div>
        </div>

 {/* =================================
          COVER SERVICES
      ================================== */}
      <div className="rounded-xl border border-royal-blue/20 bg-card p-5 shadow-sm">

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue-light text-royal-blue">
            <BookOpen className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-base">
              Cover Services
            </h3>

            <p className="text-xs text-muted-foreground">
              Configure the book cover
            </p>
          </div>
        </div>


        <div className="space-y-4">

          {/* Cover Type */}
          <div>
            <Label
              htmlFor="coverType"
              className="flex items-center gap-2 mb-2"
            >
              <Book className="w-4 h-4" />
              Cover Type
            </Label>

            <Select
              value={quote.coverType}
              onValueChange={(value) =>
                setQuote(prev => ({
                  ...prev,
                  coverType: value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cover type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Soft">
                  Soft Cover
                </SelectItem>

                <SelectItem value="Hard">
                  Hard Cover
                </SelectItem>

                <SelectItem value="Folded">
                  Folded Cover
                </SelectItem>

                <SelectItem value="Hard+Folded">
                  Hard + Folded
                </SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Conditional Cover Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {(quote.coverType === "Hard" ||
              quote.coverType === "Hard+Folded") && (
              <div>
                <Label
                  htmlFor="hardCoverPrice"
                  className="mb-2 block text-xs"
                >
                  Hard Cover / Copy
                </Label>

                <Input
                  id="hardCoverPrice"
                  type="number"
                  value={quote.hardCoverPrice || ""}
                  onChange={(e) =>
                    setQuote(prev => ({
                      ...prev,
                      hardCoverPrice:
                        parseFloat(e.target.value) || 0
                    }))
                  }
                  placeholder="NGN"
                />
              </div>
            )}


            {(quote.coverType === "Folded" ||
              quote.coverType === "Hard+Folded") && (
              <div>
                <Label
                  htmlFor="foldedCoverPrice"
                  className="mb-2 block text-xs"
                >
                  Folded Cover / Copy
                </Label>

                <Input
                  id="foldedCoverPrice"
                  type="number"
                  value={quote.foldedCoverPrice || ""}
                  onChange={(e) =>
                    setQuote(prev => ({
                      ...prev,
                      foldedCoverPrice:
                        parseFloat(e.target.value) || 0
                    }))
                  }
                  placeholder="NGN"
                />
              </div>
            )}

          </div>

        </div>
      </div>
        <div className="space-y-3">

          {/* Design */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label
                htmlFor="includeDesign"
                className="cursor-pointer font-medium"
              >
                Design
              </Label>

              <p className="text-xs text-muted-foreground mt-1">
                Cover/interior design service
              </p>
            </div>

            <Switch
              id="includeDesign"
              checked={quote.includeDesign}
              onCheckedChange={(checked) =>
                setQuote(prev => ({
                  ...prev,
                  includeDesign: checked
                }))
              }
            />
          </div>


          {/* ISBN */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label
                htmlFor="includeISBN"
                className="cursor-pointer font-medium"
              >
                ISBN
              </Label>

              <p className="text-xs text-muted-foreground mt-1">
                ISBN registration service
              </p>
            </div>

            <Switch
              id="includeISBN"
              checked={quote.includeISBN}
              onCheckedChange={(checked) =>
                setQuote(prev => ({
                  ...prev,
                  includeISBN: checked
                }))
              }
            />
          </div>

        </div>
      </div>


      {/* =================================
          INTERIOR SERVICES
      ================================== */}
      <div className="rounded-xl border border-royal-blue/20 bg-card p-5 shadow-sm">
       {/* Book Specifications */}
           

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue-light text-royal-blue">
            <Printer className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-base">
              Interior Services
            </h3>

            <p className="text-xs text-muted-foreground">
              Paper and interior printing options
            </p>
          </div>
        </div>
         <Card className="border-royal-blue/20 shadow-lg">
              
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bookSize" className="flex items-center gap-2 mb-3">
                      <Maximize className="w-4 h-4" />
                      Book Size
                    </Label>
                    <Select value={quote.bookSize} onValueChange={(value) => setQuote(prev => ({...prev, bookSize: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select book size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A6">A6</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="6x9">6x9</SelectItem>
                        <SelectItem value="7x10">7x10</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(quote.coverType === "Hard" || quote.coverType === "Hard+Folded") && (
  <div>
    <Label htmlFor="hardCoverPrice" className="flex items-center gap-2 mb-3">
      <Book className="w-4 h-4" />
      Hard Cover Price Per Copy (NGN)
    </Label>
    <Input
      id="hardCoverPrice"
      type="number"
      value={quote.hardCoverPrice || ""}
      onChange={(e) =>
        setQuote(prev => ({
          ...prev,
          hardCoverPrice: parseFloat(e.target.value) || 0
        }))
      }
      placeholder="Enter hard cover price per copy"
    />
  </div>
)}

{(quote.coverType === "Folded" || quote.coverType === "Hard+Folded") && (
  <div>
    <Label htmlFor="foldedCoverPrice" className="flex items-center gap-2 mb-3">
      <Book className="w-4 h-4" />
      Folded Cover Price Per Copy (NGN)
    </Label>
    <Input
      id="foldedCoverPrice"
      type="number"
      value={quote.foldedCoverPrice || ""}
      onChange={(e) =>
        setQuote(prev => ({
          ...prev,
          foldedCoverPrice: parseFloat(e.target.value) || 0
        }))
      }
      placeholder="Enter folded cover price per copy"
    />
  </div>
)}
                  <div>
                    <Label htmlFor="coverType" className="flex items-center gap-2 mb-3">
                      <Book className="w-4 h-4" />
                      Cover Type
                    </Label>
                    <Select value={quote.coverType} onValueChange={(value) => setQuote(prev => ({...prev, coverType: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cover type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Soft">Soft</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="Folded">Folded</SelectItem>
                        <SelectItem value="Hard+Folded">Hard+Folded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pageCount" className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" />
                      Page Count
                    </Label>
                    <Input
                      id="pageCount"
                      type="number"
                      value={pageCountValue}
                      onChange={(e) => handlePageCountChange(e.target.value)}
                      placeholder="Enter page count"
                    />
                    
                  </div>
                  <div>
                    <Label htmlFor="copies" className="flex items-center gap-2 mb-3">
                      <Copy className="w-4 h-4" />
                      Copies
                    </Label>
                    <Input
                      id="copies"
                      type="number"
                      value={copiesValue}
                      onChange={(e) => handleCopiesChange(e.target.value)}
                      placeholder="Enter number of copies"
                    />
                  </div>
                </div>
                <div className="bg-royal-blue-light p-4 rounded-lg border border-royal-blue/20">
                  <div className="flex items-center gap-2 text-royal-blue font-semibold">
                    <FileStack className="w-4 h-4" />
                    Total Pages to Print: <span className="font-bold">{(quote.pageCount * quote.copies).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


        <div className="space-y-4">

          {/* Paper */}
          <div>
            <Label
              htmlFor="paperType"
              className="flex items-center gap-2 mb-2"
            >
              <Layers className="w-4 h-4" />
              Paper Type
            </Label>

            <Select
              value={quote.paperType}
              onValueChange={(value) =>
                setQuote(prev => ({
                  ...prev,
                  paperType: value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select paper type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Cream 100gsm">
                  Cream 100gsm
                </SelectItem>

                <SelectItem value="Cream 80gsm">
                  Cream 80gsm
                </SelectItem>

                <SelectItem value="Cream 70gsm">
                  Cream 70gsm
                </SelectItem>

                <SelectItem value="White 80gsm">
                  White 80gsm
                </SelectItem>

                <SelectItem value="White 70gsm">
                  White 70gsm
                </SelectItem>

                <SelectItem value="Gloss 135gsm">
                  Glossy/Art 135gsm
                </SelectItem>

                <SelectItem value="Gloss 115gsm">
                  Glossy/Art 115gsm
                </SelectItem>

                <SelectItem value="Matt 180g">
                  Matt 170gsm
                </SelectItem>

                <SelectItem value="Matt 150g">
                  Matt 150gsm
                </SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Interior Type */}
          <div>
            <Label
              htmlFor="interiorType"
              className="flex items-center gap-2 mb-2"
            >
              <PaletteIcon className="w-4 h-4" />
              Interior Type
            </Label>

            <Select
              value={quote.interiorType}
              onValueChange={(value) =>
                setQuote(prev => ({
                  ...prev,
                  interiorType: value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interior type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="B/W">
                  Black & White
                </SelectItem>

                <SelectItem value="Colour">
                  Colour
                </SelectItem>

                <SelectItem value="B/W & Colour">
                  B/W & Colour
                </SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Mixed Interior */}
          {quote.interiorType === "B/W & Colour" && (
            <div className="rounded-lg bg-muted/40 border p-4">

              <p className="text-sm font-semibold mb-3">
                Page Breakdown
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>
                  <Label className="mb-2 block text-xs">
                    B/W Pages
                  </Label>

                  <Input
                    type="number"
                    value={quote.bwPages || ""}
                    onChange={(e) =>
                      setQuote(prev => ({
                        ...prev,
                        bwPages:
                          parseInt(e.target.value) || 0
                      }))
                    }
                    placeholder="B/W pages"
                  />
                </div>


                <div>
                  <Label className="mb-2 block text-xs">
                    Colour Pages
                  </Label>

                  <Input
                    type="number"
                    value={quote.colourPages || ""}
                    onChange={(e) =>
                      setQuote(prev => ({
                        ...prev,
                        colourPages:
                          parseInt(e.target.value) || 0
                      }))
                    }
                    placeholder="Colour pages"
                  />
                </div>

              </div>
            </div>
          )}

        </div>
      </div>


     


      {/* =================================
          FINISHING SERVICES
      ================================== */}
      <div className="rounded-xl border border-royal-blue/20 bg-card p-5 shadow-sm">

        <div className="flex items-center gap-3 mb-5">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue-light text-royal-blue">
            <Settings className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-base">
              Finishing Services
            </h3>

            <p className="text-xs text-muted-foreground">
              Finishing and packaging charges
            </p>
          </div>

        </div>


        <div className="space-y-4">

          {/* Finishing Cost */}
          <div className="flex items-center justify-between rounded-lg border bg-royal-blue-light/60 p-4">

            <div>
              <p className="font-medium text-royal-blue">
                Finishing Cost
              </p>

              <p className="text-xs text-muted-foreground">
                Automatically calculated
              </p>
            </div>

            <span className="font-bold text-royal-blue">
              {formatCurrency(calculations.finishingCost)}
            </span>

          </div>


          {/* Packaging Cost */}
          <div className="flex items-center justify-between rounded-lg border p-4">

            <div>
              <p className="font-medium">
                Packaging Cost
              </p>

              <p className="text-xs text-muted-foreground">
                Automatically calculated
              </p>
            </div>

            <span className="font-bold">
              {formatCurrency(calculations.packagingCost)}
            </span>

          </div>


          
          

        
    </div>    
      </div>
{/* =================================
          OTHER SERVICES
      ================================== */}
      <div className="rounded-xl border border-royal-blue/20 bg-card p-5 shadow-sm">
        {/* BHR */}
          <div className="flex items-center gap-3 mb-5">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal-blue-light text-royal-blue">
            <Settings className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-semibold text-base">
              Other Services
            </h3>

            <p className="text-xs text-muted-foreground">
              Additional charges
            </p>
          </div>

            <div className="flex items-center justify-between">

              <div>
                <Label
                  htmlFor="includeBHR"
                  className="cursor-pointer font-medium"
                >
                  Apply BHR
                </Label>

                <p className="text-xs text-muted-foreground mt-1">
                  Add BHR to quotation
                </p>
              </div>

              <Switch
                id="includeBHR"
                checked={quote.includeBHR}
                onCheckedChange={(checked) =>
                  setQuote(prev => ({
                    ...prev,
                    includeBHR: checked
                  }))
                }
              />

            </div>


            {quote.includeBHR && (
              <div className="mt-4">

                <Label
                  htmlFor="bhrAmount"
                  className="mb-2 block text-xs"
                >
                  BHR Amount (NGN)
                </Label>

                <Input
                  id="bhrAmount"
                  type="number"
                  value={quote.bhrHours || ""}
                  onChange={(e) =>
                    setQuote(prev => ({
                      ...prev,
                      bhrHours:
                        parseFloat(e.target.value) || 0
                    }))
                  }
                  placeholder="Enter BHR amount"
                />

              </div>
            )}

          </div>


          {/* VAT */}
          <div className="flex items-center justify-between rounded-lg border p-4">

            <div>
              <Label
                htmlFor="includeVAT"
                className="cursor-pointer font-medium"
              >
                Apply VAT
              </Label>

              <p className="text-xs text-muted-foreground mt-1">
                VAT at 7.5%
              </p>
            </div>

            <Switch
              id="includeVAT"
              checked={quote.includeVAT}
              onCheckedChange={(checked) =>
                setQuote(prev => ({
                  ...prev,
                  includeVAT: checked
                }))
              }
            />

          </div>


          {/* Bulk Discount */}
          <div className="rounded-lg border p-4">

            <div className="flex items-center justify-between">

              <div>
                <Label
                  htmlFor="bulkDiscountToggle"
                  className="cursor-pointer font-medium"
                >
                  Bulk Discount
                </Label>

                <p className="text-xs text-muted-foreground mt-1">
                  Apply a quotation discount
                </p>
              </div>

              <Switch
                id="bulkDiscountToggle"
                checked={bulkDiscountEnabled}
                onCheckedChange={handleBulkDiscountToggle}
              />

            </div>


            {bulkDiscountEnabled && (
              <div className="mt-4">

                <Label
                  htmlFor="bulkDiscount"
                  className="mb-2 block text-xs"
                >
                  Discount Amount (NGN)
                </Label>

                <Input
                  id="bulkDiscount"
                  type="number"
                  value={bulkDiscountValue}
                  onChange={(e) =>
                    handleBulkDiscountChange(e.target.value)
                  }
                  placeholder="Enter discount amount"
                />

              </div>
            )}

          </div>


          {/* Other Charges */}
          <div className="rounded-lg border bg-muted/20 p-4">

            <div className="mb-3">
              <p className="font-medium">
                Other Charges
              </p>

              <p className="text-xs text-muted-foreground">
                Add custom services or charges
              </p>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-[1fr_130px_auto] gap-2">

              <Input
                placeholder="Description"
                value={newOther.description}
                onChange={(e) =>
                  setNewOther(prev => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
              />

              <Input
                type="number"
                placeholder="Cost"
                value={
                  newOther.cost === 0
                    ? ""
                    : newOther.cost
                }
                onChange={(e) =>
                  setNewOther(prev => ({
                    ...prev,
                    cost:
                      parseFloat(e.target.value) || 0
                  }))
                }
              />

              <Button
                onClick={addOtherService}
                className="bg-royal-blue hover:bg-royal-blue-hover"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>

            </div>


            {/* Existing Other Services */}
            {quote.others.length > 0 && (
              <div className="mt-4 space-y-2">

                {quote.others.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border bg-background p-3"
                  >

                    <div>
                      <p className="text-sm font-medium">
                        {item.description}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.cost)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        removeOtherService(index)
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                  </div>
                ))}

              </div>
            )}


            {/* Hidden Additional Charge */}
            <div className="mt-4">

              <Label
                htmlFor="extraCost"
                className="mb-2 block text-xs"
              >
                Additional Charge
              </Label>

              <Input
                id="extraCost"
                type="number"
                value={
                  quote.extraCost === 0
                    ? ""
                    : quote.extraCost
                }
                onChange={(e) =>
                  setQuote(prev => ({
                    ...prev,
                    extraCost:
                      parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="Enter additional charge"
              />

              <p className="mt-1 text-[11px] text-muted-foreground">
                This charge is included in the internal calculation.
              </p>

            </div>

          </div>

        </div>
        
      </div>
  </CardContent>
</Card>

            <Card className="border-royal-blue/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-royal-blue to-royal-blue-dark text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 p-2">
                  <Receipt className="w-5 h-5" />
                  Quote Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Line Items */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Paper Cost:</span>
                      <span className="font-semibold text-right">{formatCurrency(calculations.paperCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toner Cost:</span>
                      <span className="font-semibold text-right">{formatCurrency(calculations.tonerCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cover Cost:</span>
                      <span className="font-semibold text-right">{formatCurrency(calculations.coverCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Finishing Cost:</span>
                      <span className="font-semibold text-right">{formatCurrency(calculations.finishingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Packaging Cost:</span>
                      <span className="font-semibold text-right">{formatCurrency(calculations.packagingCost)}</span>
                    </div>
                    {quote.includeDesign && (
                      <div className="flex justify-between">
                        <span>Design:</span>
                        <span className="font-semibold text-right">{formatCurrency(calculations.designCost)}</span>
                      </div>
                    )}
                    {quote.includeISBN && (
                      <div className="flex justify-between">
                        <span>ISBN:</span>
                        <span className="font-semibold text-right">{formatCurrency(calculations.isbnCost)}</span>
                      </div>
                    )}
                    {quote.includeBHR && calculations.bhrCost > 0 && (
                      <div className="flex justify-between">
                        <span>BHR:</span>
                        <span className="font-semibold text-right">{formatCurrency(calculations.bhrCost)}</span>
                      </div>
                    )}
                    {quote.others.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.description}:</span>
                        <span className="font-semibold text-right">{formatCurrency(item.cost)}</span>
                      </div>
                    ))}
                  </div>
                  {quote.extraCost > 0 && (
  <div className="flex justify-between">
    <span>Additional Charge:</span>
    <span className="font-semibold text-right">
      {formatCurrency(quote.extraCost)}
    </span>
  </div>
)}

                  <Separator />

                   {/* Totals - Staff Console View */}
                   <div className="space-y-3">
                     {/* Profit Margin Controls */}
                     <div className="bg-royal-blue-light p-4 rounded-lg border border-royal-blue/20 space-y-3">
                       <div className="flex items-center gap-2 text-royal-blue font-semibold">
                         <Percent className="w-4 h-4" />
                         Profit Margin
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div>
                           <Label htmlFor="profitMarginPercent">Percentage (%)</Label>
                           <Input
                             id="profitMarginPercent"
                             type="number"
                             step="0.01"
                             value={profitMarginPercent}
                             onChange={(e) => handleProfitMarginPercentChange(e.target.value)}
                             placeholder="Enter profit margin %"
                           />
                         </div>
                         <div>
                           <Label htmlFor="profitMarginNGN">Amount (NGN)</Label>
                           <Input
                             id="profitMarginNGN"
                             type="number"
                             value={profitMarginNGN}
                             onChange={(e) => handleProfitMarginNGNChange(e.target.value)}
                             placeholder="Enter profit amount"
                           />
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex justify-between text-lg">
                       <span className="font-semibold">Raw Cost:</span>
                       <span className="font-bold text-right">{formatCurrency(calculations.rawCost)}</span>
                     </div>
                     <div className="flex justify-between text-lg">
                       <span className="font-semibold">Profit Margin ({quote.profitMargin.toFixed(2)}%):</span>
                       <span className="font-bold text-right">{formatCurrency(calculations.profitAmount)}</span>
                     </div>
                    {quote.applyBulkDiscount > 0 && (
                      <div className="flex justify-between text-lg text-destructive">
                        <span className="font-semibold">Bulk Discount:</span>
                        <span className="font-bold text-right">-{formatCurrency(quote.applyBulkDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Final Quotation */}
                  <div className="bg-gradient-to-r from-royal-blue to-royal-blue-dark text-white p-4 rounded-lg">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-bold">Final Quotation:</span>
                      <span className="font-bold text-right">{formatCurrency(calculations.baseBeforeTen)}</span>
                    </div>
                  </div>
                
 

                </div>
                
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                onClick={generatePDF} 
                className="w-full bg-royal-blue hover:bg-royal-blue-hover text-white font-semibold py-3 text-lg"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Generate PDF Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};