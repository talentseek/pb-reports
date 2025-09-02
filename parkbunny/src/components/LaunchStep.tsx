'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Step indicator is now handled by parent component

interface LaunchStepProps {
  campaignId: string;
  businessType?: string;
  businesses: Array<{
    id: string;
    name: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    socialLinks: any;
    enrichmentStatus: string;
    allEmails?: any;
    allPhones?: any;
    contactPeople?: any;
    businessDetails?: any;
    siteData?: any;
    address?: string | null;
  }>;
}

export default function LaunchStep({ campaignId, businesses, businessType }: LaunchStepProps) {
  // Steps are now handled by parent component

  const enrichedBusinesses = businesses.filter(b => b.enrichmentStatus === 'ENRICHED');
  const businessesWithEmail = enrichedBusinesses.filter(b => b.email);

  // Selection state: key is `${businessId}|${email}`
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [selectedNameByKey, setSelectedNameByKey] = React.useState<Map<string, string>>(new Map());
  const [overrideFirstByKey, setOverrideFirstByKey] = React.useState<Map<string, string>>(new Map());
  const [overrideLastByKey, setOverrideLastByKey] = React.useState<Map<string, string>>(new Map());

  const toggleSelection = (key: string, checked: boolean, nameOverride?: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
    setSelectedNameByKey(prev => {
      const next = new Map(prev);
      if (checked && nameOverride) {
        // Assign name only when selecting a Key Contact
        next.set(key, nameOverride);
      } else if (!checked) {
        // Only clear the name if the Key Contact is being unchecked
        if (nameOverride) {
          next.delete(key);
        }
        // If unchecking an email row (no nameOverride), keep the name mapping
      }
      return next;
    });
  };

  const getCity = (business: (typeof enrichedBusinesses)[number]): string => {
    if (business.address) {
      const parts = business.address.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) return parts[parts.length - 2];
    }
    if (business.businessDetails && typeof business.businessDetails === 'object' && business.businessDetails.city) {
      return business.businessDetails.city as string;
    }
    return '';
  };

  const splitName = (fullName?: string | null) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const deriveNameFromEmail = (email: string) => {
    const local = email.split('@')[0];
    const cleaned = local.replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
    const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const firstName = parts[0] ? capitalise(parts[0]) : '';
    const lastName = parts.slice(1).map(capitalise).join(' ');
    return { firstName, lastName };
  };

  const extractEmailDomain = (email?: string | null) => {
    if (!email) return '';
    const at = email.indexOf('@');
    return at > -1 ? email.slice(at + 1).toLowerCase() : '';
  };
  const extractWebsiteDomain = (url?: string | null) => {
    if (!url) return '';
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return '';
    }
  };

  const getUniqueEmails = (business: (typeof enrichedBusinesses)[number]) => {
    const uniques = new Map<string, { value: string; source?: string; isPrimary?: boolean; full_name?: string }>();
    const lc = (s: string) => s.toLowerCase();
    const nameFromContacts = (email: string): string | undefined => {
      if (business.contactPeople && Array.isArray(business.contactPeople)) {
        const match = business.contactPeople.find((p: any) => (p.value || '').toLowerCase() === email.toLowerCase());
        return match?.full_name;
      }
      return undefined;
    };
    if (business.email) {
      const key = lc(business.email);
      uniques.set(key, { value: business.email, isPrimary: true, full_name: nameFromContacts(business.email) });
    }
    if (business.allEmails && Array.isArray(business.allEmails)) {
      business.allEmails.forEach((e: any) => {
        const v = e?.value;
        if (!v) return;
        const key = lc(String(v));
        if (!uniques.has(key)) {
          uniques.set(key, { value: String(v), source: e.source || 'Outscraper', full_name: e.full_name || nameFromContacts(String(v)) });
        } else {
          const existing = uniques.get(key)!;
          if (!existing.full_name && (e.full_name || nameFromContacts(String(v)))) {
            existing.full_name = e.full_name || nameFromContacts(String(v));
          }
        }
      });
    }
    return Array.from(uniques.values());
  };

  const normaliseCategory = (cat?: string) => (cat || '').toLowerCase();

  const getTemplate = (category: string, company: string, city: string, firstName?: string) => {
    const greeting = firstName && firstName.trim().length > 0 ? `Hi ${firstName},` : 'Hi there,';
    const c = normaliseCategory(category);
    if (c.includes('hotel')) {
      return {
        subject: 'Extra Perks for Your Guests – Discounted Parking + Local Rewards 🐰🚗',
        body: `${greeting}\n\nWe’re Park Bunny – the rewarding local parking payment app – and we’d love to help make your guests’ stay even smoother.\n\nDo you need more parking?\nWe have a car park close by and are delighted to offer your guests an exclusive XX% discount on parking.\n\nHow it works is simple:\n• Guests download the Park Bunny app (free on iOS & Android).\n• You share a hidden location ID code with them at check-in.\n• They enter the code in the app and instantly receive their XX% discount on our standard tariff.\n\nBut that’s not all!\nWith Park Bunny, your guests don’t just save on parking – they also unlock exclusive rewards from nearby businesses including retailers, gyms, and hospitality venues. And if your hotel would like to promote your own offers to drivers parking in the area, we’d be delighted to feature you too.\n\nWe’d love to explore how we can support your guests in ${city || 'your area'} and drive more value to ${company}. When would be a good time to chat?\n\nSimply reply to this email “I’m interested” and we can set up your special code within 24 hours.\n\nBest regards,`
      };
    }
    if (c.includes('gym') || c.includes('fitness') || c.includes('health') || c.includes('wellbeing')) {
      return {
        subject: 'Boost Your Gym Memberships with Discounted Parking + Local Rewards',
        body: `${greeting}\n\nWe’re Park Bunny – the rewarding local parking payment app – and we’d love to help make it easier (and more rewarding!) for your members to visit your gym.\n\nWant to remove parking hassles for your members?\nWe have a car park nearby and can offer your members an exclusive XX% discount on parking whenever they come to train.\n\nIt’s super simple:\n• Members download the Park Bunny app (free on iOS & Android).\n• You give them a hidden location ID code when they sign up or check in.\n• They enter the code in the app and instantly enjoy XX% off our standard tariff.\n\nBut here’s the exciting part…\nPark Bunny also allows gyms like yours to promote special offers directly to local drivers – whether that’s intro membership deals, class promotions, or seasonal offers. It’s a great way to bring in new faces and turn them into loyal members.\n\nWe’d love to show you how Park Bunny can help grow your gym community in ${city || 'your area'}, while giving your members an extra perk they’ll appreciate. When would be a good time to chat?\n\nSimply reply to this email “I’m interested” and we can set up your special code within 24 hours.\n\nBest regards,`
      };
    }
    if (c.includes('co') && c.includes('work')) {
      return {
        subject: 'Make Your Co-Working Space Even More Attractive with Discounted Parking',
        body: `${greeting}\n\nWe’re Park Bunny – the rewarding local parking payment app – and we’d love to help make your co-working space even more appealing to freelancers, startups, and businesses.\n\nNeed an extra perk for your members?\nWe have a car park nearby and can offer your members an exclusive XX% discount on parking whenever they use your space.\n\nHere’s how it works:\n• Members download the Park Bunny app (free on iOS & Android).\n• You share a hidden location ID code with them.\n• They enter the code in the app and instantly enjoy XX% off our standard tariff.\n\nBut that’s not all!\nPark Bunny also gives co-working operators the chance to promote offers directly to local drivers – whether that’s introductory desk deals, meeting room discounts, or membership packages. It’s a smart way to attract professionals working nearby who may be looking for flexible office space.\n\nWe’d love to show you how Park Bunny can support your members and help grow your co-working community in ${city || 'your area'}. When would be a good time to connect?\n\nSimply reply to this email “I’m interested” and we can set up your special code within 24 hours.\n\nBest regards,`
      };
    }
    // Default: Restaurants
    return {
      subject: 'Treat Your Diners to Discounted Parking + Local Rewards',
      body: `${greeting}\n\nWe’re Park Bunny – the rewarding local parking payment app – and we’d love to help make dining at your restaurant even easier for your customers.\n\nWant to make life simpler for your diners?\nWe have a car park nearby and are delighted to offer your guests an exclusive XX% discount on parking when they dine with you.\n\nHow it works is simple:\n• Diners download the Park Bunny app (free on iOS & Android).\n• You provide them with a hidden location ID code when they book or arrive.\n• They enter the code in the app and instantly enjoy XX% off our standard tariff.\n\nAnd there’s more!\nPark Bunny users also unlock exclusive rewards from local businesses – from gyms to retailers to hospitality venues. If you’d like to promote your own offers to nearby drivers, we’d love to feature you as part of our community too.\n\nWe’d be delighted to show you how Park Bunny can add extra value for your diners in ${city || 'your area'} and bring in more repeat customers. When’s a good time to connect?\n\nSimply reply to this email “I’m interested” and we can set up your special code within 24 hours.\n\nBest regards,`
    };
  };

  type ContactRow = {
    key: string;
    businessId: string;
    email: string;
    fullName?: string;
    company: string;
    city: string;
    category: string;
  };

  const detectBusinessCategory = (business: (typeof enrichedBusinesses)[number]): string => {
    const name = (business.name || '').toLowerCase();
    const industries: string[] = Array.isArray(business.businessDetails?.industry) ? business.businessDetails.industry.map((x: any) => String(x).toLowerCase()) : [];
    const text = `${name} ${industries.join(' ')}`;
    if (/(hotel|inn|guest|bnb|bed\s*&\s*breakfast|bed\s+and\s+breakfast)/i.test(text)) return 'hotels';
    if (/(gym|fitness|health|wellbeing)/i.test(text)) return 'gyms';
    if (/(co[-\s]?work|workspace|shared\s+office)/i.test(text)) return 'co-working';
    return 'restaurants';
  };

  const buildContactRows = (): ContactRow[] => {
    const rows: ContactRow[] = [];
    enrichedBusinesses.forEach((business) => {
      const city = getCity(business);
      const company = business.name;
      const category = detectBusinessCategory(business);
      const seen = new Set<string>();

      // Names are ONLY assigned when user selects a Key Contact checkbox
      const getSelectedName = (key: string): string | undefined => selectedNameByKey.get(key);

      if (business.email) {
        const key = `${business.id}|${business.email}`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({ key, businessId: business.id, email: business.email, fullName: getSelectedName(key), company, city, category });
        }
      }

      if (business.allEmails && Array.isArray(business.allEmails)) {
        business.allEmails.forEach((e: any) => {
          const email = e?.value;
          if (!email) return;
          const key = `${business.id}|${email}`;
          if (seen.has(key)) return;
          seen.add(key);
          const fullName = getSelectedName(key);
          rows.push({ key, businessId: business.id, email, fullName, company, city, category });
        });
      }
    });
    return rows;
  };

  const allContactRows = buildContactRows();
  const selectedRows = allContactRows.filter(r => selectedKeys.has(r.key));

  const exportSelectedCSV = () => {
    const headers = [
      'First name',
      'Lastname',
      'Company',
      'Location',
      'Subject',
      'Personalised email',
      'Email'
    ];

    const csvData = selectedRows.map(row => {
      const { firstName, lastName } = splitName(row.fullName);
      const template = getTemplate(row.category, row.company, row.city, firstName);
      const overrideFirst = overrideFirstByKey.get(row.key) || '';
      const overrideLast = overrideLastByKey.get(row.key) || '';
      const outFirst = overrideFirst || firstName;
      const outLast = overrideLast || lastName;
      return [
        outFirst,
        outLast,
        row.company,
        row.city,
        template.subject,
        template.body,
        row.email
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `outreach-selected-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* Launch Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Launch Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{businesses.length}</div>
              <div className="text-sm text-gray-600">Total Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enrichedBusinesses.length}</div>
              <div className="text-sm text-gray-600">Enriched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{businessesWithEmail.length}</div>
              <div className="text-sm text-gray-600">Ready to Contact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Launch Options */}
      <Card>
        <CardHeader>
          <CardTitle>Launch Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Download Outreach File */}
            <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-medium mb-2">📧 Outreach File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the emails you want to export, then download a CSV you can import into your outreach tool.
              </p>
              <Button onClick={exportSelectedCSV} disabled={selectedRows.length === 0} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                Download outreach file ({selectedRows.length} selected)
              </Button>
            </div>

            
          </div>
        </CardContent>
      </Card>

      {/* Business List with Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses Ready for Outreach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrichedBusinesses.map((business) => (
              <div key={business.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{business.name}</div>
                    {business.website && (
                      <div className="text-sm text-gray-600 mt-1">
                        🌐 <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {business.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
                
                {/* Enriched Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Addresses */}
                  {(business.email || business.allEmails) && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📧 Email Addresses
                      </div>
                      <div className="space-y-1">
                        {getUniqueEmails(business).map((email, idx) => (
                          <div key={idx} className={`text-sm p-2 rounded border flex items-center gap-2 ${email.isPrimary ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <input
                              type="checkbox"
                              checked={selectedKeys.has(`${business.id}|${email.value}`)}
                              onChange={(e) => toggleSelection(`${business.id}|${email.value}`, e.currentTarget.checked)}
                            />
                            <div className="flex-1">
                              <a href={`mailto:${email.value}`} className={email.isPrimary ? 'text-blue-600 hover:underline' : 'text-gray-700 hover:underline'}>
                                {email.value} {email.isPrimary && <span className="text-xs text-gray-500">(Primary)</span>}
                              </a>
                              {email.source && !email.isPrimary && <span className="text-xs text-gray-500 ml-2">({email.source})</span>}
                              {email.full_name && (
                                <div className="text-xs text-gray-500">{email.full_name}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Phone Numbers */}
                  {(business.phone || business.allPhones) && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📞 Phone Numbers {business.allPhones && business.allPhones.length > 1 && `(${business.allPhones.length} total)`}
                      </div>
                      <div className="space-y-1">
                        {/* Primary phone */}
                        {business.phone && (
                          <div className="text-sm bg-green-50 p-2 rounded border">
                            <a href={`tel:${business.phone}`} className="text-green-600 hover:underline">
                              {business.phone} <span className="text-xs text-gray-500">(Primary)</span>
                            </a>
                          </div>
                        )}
                        {/* Additional phones */}
                        {business.allPhones && Array.isArray(business.allPhones) && business.allPhones.length > 1 && (
                          business.allPhones.slice(1).map((phone: any, idx) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded border">
                              <a href={`tel:${phone.value}`} className="text-gray-600 hover:underline">
                                {phone.value}
                              </a>
                              {phone.source && <span className="text-xs text-gray-500 ml-2">({phone.source})</span>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Social Media Links */}
                  {business.socialLinks && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">📱 Social Media</div>
                      <div className="space-y-1">
                        {business.socialLinks.facebook && (
                          <div className="text-sm bg-blue-50 p-2 rounded border">
                            <a href={business.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              📘 Facebook
                            </a>
                          </div>
                        )}
                        {business.socialLinks.instagram && (
                          <div className="text-sm bg-pink-50 p-2 rounded border">
                            <a href={business.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                              📷 Instagram
                            </a>
                          </div>
                        )}
                        {business.socialLinks.twitter && (
                          <div className="text-sm bg-sky-50 p-2 rounded border">
                            <a href={business.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                              🐦 Twitter
                            </a>
                          </div>
                        )}
                        {business.socialLinks.linkedin && (
                          <div className="text-sm bg-blue-50 p-2 rounded border">
                            <a href={business.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              💼 LinkedIn
                            </a>
                          </div>
                        )}
                        {business.socialLinks.youtube && (
                          <div className="text-sm bg-red-50 p-2 rounded border">
                            <a href={business.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                              📺 YouTube
                            </a>
                          </div>
                        )}
                        {business.socialLinks.tiktok && (
                          <div className="text-sm bg-black bg-opacity-10 p-2 rounded border">
                            <a href={business.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline">
                              🎵 TikTok
                            </a>
                          </div>
                        )}
                        {business.socialLinks.github && (
                          <div className="text-sm bg-gray-50 p-2 rounded border">
                            <a href={business.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline">
                              💻 GitHub
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Contact People Section */}
                {business.contactPeople && Array.isArray(business.contactPeople) && business.contactPeople.length > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm font-medium text-purple-800 mb-2">
                      👥 Key Contacts ({business.contactPeople.length} people)
                    </div>
                    <div className="space-y-2">
                      {business.contactPeople.map((person: any, idx) => {
                        const key = `${business.id}|${person.value || ''}`;
                        const currentSplit = splitName(person.full_name);
                        const first = overrideFirstByKey.get(key) ?? currentSplit.firstName;
                        const last = overrideLastByKey.get(key) ?? currentSplit.lastName;
                        const emailDomain = extractEmailDomain(person.value);
                        const siteDomain = extractWebsiteDomain(business.website);
                        const domainMismatch = emailDomain && siteDomain && !emailDomain.endsWith(siteDomain);
                        return (
                          <div key={idx} className="text-sm bg-white p-2 rounded border">
                            <div className="font-medium text-purple-700">{person.full_name}</div>
                            <div className="text-xs text-gray-600">
                              {person.title} {person.level && `(${person.level})`}
                              {person.inferred_salary && ` • ${person.inferred_salary}`}
                            </div>
                            {person.value && (
                              <div className="text-xs mt-1 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedKeys.has(key)}
                                  onChange={(e) => toggleSelection(key, e.currentTarget.checked, `${first} ${last}`.trim())}
                                />
                                <a href={`mailto:${person.value}`} className="text-purple-600 hover:underline">
                                  📧 {person.value}
                                </a>
                                {domainMismatch && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">
                                    domain mismatch
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Inline editable names */}
                            {person.value && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                  className="border rounded px-2 py-1 text-xs"
                                  placeholder="First name"
                                  value={first}
                                  onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    setOverrideFirstByKey(prev => new Map(prev).set(key, v));
                                    if (selectedKeys.has(key)) {
                                      const newFull = `${v} ${overrideLastByKey.get(key) ?? last}`.trim();
                                      setSelectedNameByKey(prev => new Map(prev).set(key, newFull));
                                    }
                                  }}
                                />
                                <input
                                  className="border rounded px-2 py-1 text-xs"
                                  placeholder="Lastname"
                                  value={last}
                                  onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    setOverrideLastByKey(prev => new Map(prev).set(key, v));
                                    if (selectedKeys.has(key)) {
                                      const newFull = `${overrideFirstByKey.get(key) ?? first} ${v}`.trim();
                                      setSelectedNameByKey(prev => new Map(prev).set(key, newFull));
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="col-span-2 text-[11px] text-gray-600 underline"
                                  onClick={() => {
                                    const d = deriveNameFromEmail(person.value);
                                    setOverrideFirstByKey(prev => new Map(prev).set(key, d.firstName));
                                    setOverrideLastByKey(prev => new Map(prev).set(key, d.lastName));
                                    if (selectedKeys.has(key)) {
                                      const newFull = `${d.firstName} ${d.lastName}`.trim();
                                      setSelectedNameByKey(prev => new Map(prev).set(key, newFull));
                                    }
                                  }}
                                >
                                  Use email-derived name
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Business Intelligence Section */}
                {business.businessDetails && typeof business.businessDetails === 'object' && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="text-sm font-medium text-indigo-800 mb-2">🏢 Business Intelligence</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {business.businessDetails.size && (
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium">Size:</span> {typeof business.businessDetails.size === 'string' ? business.businessDetails.size : `${(business.businessDetails.size as any).f}-${(business.businessDetails.size as any).t} employees`}
                        </div>
                      )}
                      {business.businessDetails.industry && Array.isArray(business.businessDetails.industry) && business.businessDetails.industry.length > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium">Industry:</span> {business.businessDetails.industry.join(', ')}
                        </div>
                      )}
                      {business.businessDetails.founded && (
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium">Founded:</span> {business.businessDetails.founded}
                        </div>
                      )}
                      {business.businessDetails.type && (
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium">Type:</span> {business.businessDetails.type}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No enrichment data message */}
                {!business.email && !business.phone && !business.socialLinks && !business.contactPeople && !business.businessDetails && (
                  <div className="text-sm text-gray-500 italic">
                    No contact information found during enrichment
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
