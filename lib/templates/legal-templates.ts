/**
 * Hardcoded legal templates for startup founders.
 * Auto-filled with company name, founder name, and state.
 * MIT licensed. Not legal advice — have a lawyer review before signing.
 */

export interface TemplateSection {
  heading?: string;
  body: string;
}

export interface LegalTemplate {
  id: string;
  title: string;
  description: string;
  sections: TemplateSection[];
}

export interface FillData {
  companyName: string;
  founderName: string;
  state: string;
}

function d(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function fillText(text: string, data: FillData): string {
  return text
    .replace(/\{\{COMPANY\}\}/g, data.companyName || "________")
    .replace(/\{\{FOUNDER\}\}/g, data.founderName || "________")
    .replace(/\{\{STATE\}\}/g, data.state || "________")
    .replace(/\{\{DATE\}\}/g, d());
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: "board-consent",
    title: "Board Consent",
    description:
      "Written consent of the sole director in lieu of a meeting. Use for initial corporate actions after incorporation.",
    sections: [
      {
        heading: "UNANIMOUS WRITTEN CONSENT OF THE BOARD OF DIRECTORS OF {{COMPANY}}",
        body: "The undersigned, being the sole director of {{COMPANY}}, a {{STATE}} corporation (the \"Company\"), hereby takes the following actions by written consent in lieu of a meeting, pursuant to the {{STATE}} General Corporation Law.",
      },
      {
        heading: "1. APPOINTMENT OF OFFICERS",
        body: "RESOLVED, that the following person is hereby appointed to serve as the officer of the Company in the capacity set forth below, to serve until their successor is duly elected and qualified or until their earlier resignation or removal:\n\nPresident & Secretary: {{FOUNDER}}",
      },
      {
        heading: "2. PRINCIPAL OFFICE",
        body: "RESOLVED, that the principal office of the Company shall be located at the address determined by the President from time to time.",
      },
      {
        heading: "3. FISCAL YEAR",
        body: "RESOLVED, that the fiscal year of the Company shall end on December 31 of each year.",
      },
      {
        heading: "4. BANK ACCOUNTS",
        body: "RESOLVED, that the officers of the Company are authorized to open bank accounts in the name of the Company with such banks or financial institutions as such officers may determine, and that any officer acting alone is authorized to sign checks, drafts, and other instruments on behalf of the Company.",
      },
      {
        heading: "5. ISSUANCE OF STOCK",
        body: "RESOLVED, that the Company is authorized to issue shares of Common Stock to {{FOUNDER}} pursuant to a Stock Purchase Agreement, in consideration for the purchase price set forth therein, subject to the Company's right of repurchase as specified in such agreement.",
      },
      {
        heading: "6. ELECTION UNDER SECTION 83(b)",
        body: "RESOLVED, that each purchaser of shares subject to a vesting schedule or the Company's repurchase right is strongly advised to file an election under Section 83(b) of the Internal Revenue Code within 30 days of the date of purchase.",
      },
      {
        heading: "7. QUALIFICATION TO DO BUSINESS",
        body: "RESOLVED, that the officers of the Company are authorized to take all actions necessary to qualify the Company to do business in any state or jurisdiction where such qualification is required.",
      },
      {
        heading: "8. RATIFICATION",
        body: "RESOLVED, that all actions previously taken by any officer or director of the Company in connection with the matters described herein are hereby ratified, confirmed, and approved in all respects.",
      },
      {
        body: "This consent shall be filed with the minutes of the proceedings of the Board of Directors.\n\n\nDate: {{DATE}}\n\n\n_______________________________\n{{FOUNDER}}, Sole Director",
      },
    ],
  },
  {
    id: "stock-purchase",
    title: "Stock Purchase Agreement",
    description:
      "Founder stock purchase with 4-year vesting and 1-year cliff. Standard for initial equity issuance.",
    sections: [
      {
        heading: "STOCK PURCHASE AGREEMENT",
        body: "This Stock Purchase Agreement (\"Agreement\") is entered into as of {{DATE}} by and between {{COMPANY}}, a {{STATE}} corporation (the \"Company\"), and {{FOUNDER}} (the \"Purchaser\").",
      },
      {
        heading: "1. PURCHASE AND SALE OF SHARES",
        body: "1.1 Sale and Issuance. Subject to the terms and conditions of this Agreement, the Company hereby agrees to sell to the Purchaser, and the Purchaser hereby agrees to purchase from the Company, [NUMBER] shares of the Company's Common Stock (the \"Shares\") at a purchase price of $0.0001 per share, for a total purchase price of $[AMOUNT] (the \"Purchase Price\").\n\n1.2 Payment. The Purchaser shall pay the Purchase Price by check or wire transfer to the Company concurrently with execution of this Agreement.",
      },
      {
        heading: "2. RIGHT OF REPURCHASE",
        body: "2.1 Repurchase Option. In the event the Purchaser's service to the Company is terminated for any reason (the \"Termination\"), the Company shall have the right to repurchase any or all of the Unvested Shares at the original Purchase Price per share.\n\n2.2 Vesting Schedule. 25% of the Shares shall vest on the one-year anniversary of the Vesting Commencement Date (the \"Cliff Date\"). The remaining 75% of the Shares shall vest in equal monthly installments over the following 36 months, such that 100% of the Shares are vested on the four-year anniversary of the Vesting Commencement Date.\n\n2.3 Vesting Commencement Date. The Vesting Commencement Date is {{DATE}}.\n\n2.4 Exercise Period. The Company must exercise the repurchase option within 90 days of the Termination date by delivering written notice to the Purchaser.",
      },
      {
        heading: "3. RESTRICTIONS ON TRANSFER",
        body: "3.1 The Purchaser shall not sell, assign, transfer, pledge, hypothecate, or otherwise dispose of any Unvested Shares except with the prior written consent of the Company.\n\n3.2 Right of First Refusal. Before any Vested Shares may be sold or transferred, the Purchaser shall give the Company written notice and the Company shall have a right of first refusal to purchase such shares at the proposed transfer price.",
      },
      {
        heading: "4. SECTION 83(b) ELECTION",
        body: "The Purchaser understands that Section 83 of the Internal Revenue Code taxes the difference between the amount paid for the Shares and their fair market value as ordinary income. The Purchaser hereby acknowledges that the Purchaser has been advised to consult with a tax advisor regarding the advisability of filing an election under Section 83(b) of the Code with the IRS within 30 days of the date of purchase. THE PURCHASER ACKNOWLEDGES THAT IT IS THE PURCHASER'S SOLE RESPONSIBILITY, AND NOT THE COMPANY'S, TO FILE A TIMELY 83(b) ELECTION.",
      },
      {
        heading: "5. REPRESENTATIONS",
        body: "5.1 The Purchaser represents that the Shares are being acquired for investment for the Purchaser's own account, not as a nominee or agent, and not with a view to resale or distribution.\n\n5.2 The Purchaser is an accredited investor or has such knowledge and experience in financial and business matters as to be capable of evaluating the merits and risks of this investment.",
      },
      {
        heading: "6. GENERAL PROVISIONS",
        body: "6.1 Governing Law. This Agreement shall be governed by the laws of the State of {{STATE}}.\n\n6.2 Entire Agreement. This Agreement constitutes the entire agreement between the parties.\n\n6.3 Amendments. This Agreement may not be amended except in writing signed by both parties.\n\n\nCOMPANY:\n{{COMPANY}}\n\nBy: _______________________________\nName: {{FOUNDER}}\nTitle: President\n\nPURCHASER:\n\n_______________________________\n{{FOUNDER}}",
      },
    ],
  },
  {
    id: "83b-election",
    title: "83(b) Election Letter",
    description:
      "IRS election to be taxed on stock at grant date. Must be filed within 30 days of stock purchase. Do not miss this deadline.",
    sections: [
      {
        heading: "ELECTION UNDER SECTION 83(b) OF THE INTERNAL REVENUE CODE OF 1986",
        body: "The undersigned taxpayer hereby elects, pursuant to Section 83(b) of the Internal Revenue Code of 1986, as amended, to include in gross income for the current taxable year the amount of any compensation taxable in connection with the receipt of the property described below.",
      },
      {
        body: "1. The name, address, and taxpayer identification number of the undersigned are:\n\nName: {{FOUNDER}}\nAddress: ________________________________________\nSSN: ___-__-____",
      },
      {
        body: "2. Description of the property with respect to which the election is being made:\n\n[NUMBER] shares of Common Stock of {{COMPANY}}, a {{STATE}} corporation.",
      },
      {
        body: "3. The date on which the property was transferred: {{DATE}}",
      },
      {
        body: "4. The taxable year for which this election is being made: [YEAR]",
      },
      {
        body: "5. Nature of the restriction(s) to which the property is subject:\n\nThe shares are subject to a right of repurchase by the Company at cost, which right lapses over a 4-year period pursuant to a vesting schedule.",
      },
      {
        body: "6. The fair market value at the time of transfer (determined without regard to any restriction other than a restriction which by its terms will never lapse) of such property: $[FMV]",
      },
      {
        body: "7. The amount paid for such property: $[AMOUNT]",
      },
      {
        body: "8. The amount to include in gross income is: $[FMV minus AMOUNT PAID]",
      },
      {
        body: "The undersigned has submitted a copy of this statement to the person for whom the services were performed in connection with the undersigned's receipt of the above-described property. The transferee of such property is the person performing the services in connection with the transfer of said property.\n\nThe undersigned understands that the foregoing election may not be revoked except with the consent of the Commissioner.\n\n\nDate: {{DATE}}\n\n\n_______________________________\n{{FOUNDER}}",
      },
      {
        heading: "FILING INSTRUCTIONS",
        body: "IMPORTANT: You must file this election within 30 days of the stock purchase date. File by mailing the signed election to:\n\nInternal Revenue Service Center\nWhere you file your tax return\n\nAlso:\n- Send a copy to {{COMPANY}}\n- Keep a copy for your records\n- Attach a copy to your federal income tax return for the year\n- If married, your spouse may need to file a similar election",
      },
    ],
  },
  {
    id: "ip-assignment",
    title: "IP Assignment",
    description:
      "Assigns all founder-created intellectual property to the company. Execute at incorporation.",
    sections: [
      {
        heading: "INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT",
        body: "This Intellectual Property Assignment Agreement (\"Agreement\") is entered into as of {{DATE}} by and between {{FOUNDER}} (\"Assignor\") and {{COMPANY}}, a {{STATE}} corporation (\"Company\").",
      },
      {
        heading: "RECITALS",
        body: "WHEREAS, the Assignor has developed certain intellectual property, inventions, ideas, and works of authorship prior to or in connection with the formation of the Company that are related to the Company's current or anticipated business;\n\nWHEREAS, the Company desires to acquire all right, title, and interest in such intellectual property;",
      },
      {
        heading: "1. ASSIGNMENT OF INTELLECTUAL PROPERTY",
        body: "1.1 Assignment. The Assignor hereby irrevocably assigns, transfers, and conveys to the Company all right, title, and interest worldwide in and to all intellectual property created, conceived, developed, or reduced to practice by the Assignor, whether alone or jointly with others, that relates to the Company's business (the \"Assigned IP\"), including but not limited to:\n\n(a) All inventions, discoveries, improvements, and trade secrets;\n(b) All copyrightable works, including source code, documentation, and designs;\n(c) All trademarks, service marks, trade names, and domain names;\n(d) All patent rights and applications;\n(e) All know-how, processes, and techniques.\n\n1.2 Prior Inventions. The Assigned IP includes all intellectual property developed by the Assignor prior to the date hereof that relates to the Company's business, as listed on Exhibit A attached hereto.",
      },
      {
        heading: "2. FURTHER ASSURANCES",
        body: "The Assignor agrees to execute any documents and take any actions reasonably requested by the Company to perfect, evidence, or record the assignment of the Assigned IP, including patent applications, copyright registrations, and assignments.",
      },
      {
        heading: "3. REPRESENTATIONS AND WARRANTIES",
        body: "3.1 The Assignor represents that the Assignor is the sole owner of the Assigned IP and has the right to assign it.\n\n3.2 The Assignor represents that the Assigned IP does not infringe the intellectual property rights of any third party.\n\n3.3 The Assignor represents that there are no liens, encumbrances, or claims on the Assigned IP.",
      },
      {
        heading: "4. CONSIDERATION",
        body: "The Assignor acknowledges that the issuance of shares of Common Stock of the Company to the Assignor pursuant to the Stock Purchase Agreement constitutes adequate consideration for this assignment.",
      },
      {
        heading: "5. GOVERNING LAW",
        body: "This Agreement shall be governed by and construed in accordance with the laws of the State of {{STATE}}.\n\n\nASSIGNOR:\n\n_______________________________\n{{FOUNDER}}\n\nCOMPANY:\n{{COMPANY}}\n\nBy: _______________________________\nName: {{FOUNDER}}\nTitle: President\n\nDate: {{DATE}}",
      },
    ],
  },
  {
    id: "ciia",
    title: "CIIA",
    description:
      "Confidential Information and Invention Assignment Agreement. Standard for employees and contractors.",
    sections: [
      {
        heading: "CONFIDENTIAL INFORMATION AND INVENTION ASSIGNMENT AGREEMENT",
        body: "This Confidential Information and Invention Assignment Agreement (\"Agreement\") is entered into by {{COMPANY}}, a {{STATE}} corporation (the \"Company\"), and the undersigned (\"Employee\"), effective as of the Employee's first day of employment or engagement with the Company.",
      },
      {
        heading: "1. CONFIDENTIAL INFORMATION",
        body: "1.1 Definition. \"Confidential Information\" means any non-public information disclosed by the Company to the Employee, including but not limited to: business plans, financial information, customer lists, technical data, source code, product plans, trade secrets, marketing strategies, and any other proprietary information.\n\n1.2 Obligations. The Employee agrees to:\n\n(a) Hold all Confidential Information in strict confidence;\n(b) Not disclose Confidential Information to any third party without prior written consent;\n(c) Not use Confidential Information for any purpose other than performing duties for the Company;\n(d) Take reasonable precautions to prevent unauthorized disclosure;\n(e) Return all Confidential Information upon termination of employment.",
      },
      {
        heading: "2. INVENTIONS",
        body: "2.1 Assignment. The Employee hereby assigns to the Company all right, title, and interest in any invention, improvement, discovery, work of authorship, or trade secret (\"Inventions\") that the Employee makes, conceives, or reduces to practice, either alone or jointly, during the period of employment that:\n\n(a) Relates to the Company's business or actual or anticipated research or development; or\n(b) Results from any work performed by the Employee for the Company; or\n(c) Is developed using the Company's equipment, supplies, or facilities; or\n(d) Is developed using the Company's Confidential Information.\n\n2.2 Disclosure. The Employee will promptly disclose to the Company all Inventions.\n\n2.3 Works Made for Hire. The Employee acknowledges that all copyrightable works prepared within the scope of employment are \"works made for hire\" under the Copyright Act.",
      },
      {
        heading: "3. PRIOR INVENTIONS",
        body: "The Employee has listed on Exhibit A all inventions that the Employee made prior to employment and that the Employee wishes to exclude from this Agreement. If no list is attached, the Employee represents that there are no such prior inventions.",
      },
      {
        heading: "4. NON-SOLICITATION",
        body: "During employment and for 12 months after termination, the Employee agrees not to directly or indirectly solicit any employee or contractor of the Company to leave the Company's employment or engagement.",
      },
      {
        heading: "5. RETURN OF MATERIALS",
        body: "Upon termination of employment, the Employee shall immediately return all documents, equipment, and materials containing Confidential Information.",
      },
      {
        heading: "6. GENERAL",
        body: "6.1 Governing Law. This Agreement shall be governed by the laws of the State of {{STATE}}.\n\n6.2 Entire Agreement. This Agreement constitutes the entire agreement regarding confidentiality and invention assignment.\n\n6.3 Severability. If any provision is found to be unenforceable, the remaining provisions shall remain in effect.\n\n\nCOMPANY:\n{{COMPANY}}\n\nBy: _______________________________\nName: {{FOUNDER}}\nTitle: President\n\nEMPLOYEE:\n\n_______________________________\nName: ___________________________\nDate: {{DATE}}",
      },
    ],
  },
  {
    id: "mutual-nda",
    title: "Mutual NDA",
    description:
      "Mutual non-disclosure agreement for conversations with potential partners, investors, or clients.",
    sections: [
      {
        heading: "MUTUAL NON-DISCLOSURE AGREEMENT",
        body: "This Mutual Non-Disclosure Agreement (\"Agreement\") is entered into as of {{DATE}} by and between:\n\n{{COMPANY}}, a {{STATE}} corporation (\"Party A\")\n\nand\n\n_________________________ (\"Party B\")\n\n(each a \"Party\" and collectively the \"Parties\").",
      },
      {
        heading: "1. PURPOSE",
        body: "The Parties wish to explore a potential business relationship (the \"Purpose\") and, in connection therewith, each Party may disclose certain confidential and proprietary information to the other Party.",
      },
      {
        heading: "2. CONFIDENTIAL INFORMATION",
        body: "\"Confidential Information\" means any information disclosed by either Party to the other, whether orally, in writing, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, but is not limited to, business plans, financial information, technical data, product plans, customer lists, and trade secrets.\n\nConfidential Information does not include information that:\n\n(a) Is or becomes publicly available through no fault of the receiving Party;\n(b) Was already known to the receiving Party prior to disclosure;\n(c) Is independently developed by the receiving Party without use of Confidential Information;\n(d) Is rightfully received from a third party without restriction on disclosure.",
      },
      {
        heading: "3. OBLIGATIONS",
        body: "Each Party agrees to:\n\n(a) Hold the other Party's Confidential Information in strict confidence;\n(b) Not disclose Confidential Information to any third party without prior written consent;\n(c) Use Confidential Information solely for the Purpose;\n(d) Limit access to Confidential Information to those employees and advisors who need to know and who are bound by similar confidentiality obligations;\n(e) Take reasonable measures to protect the confidentiality of the information, using at least the same degree of care used to protect its own confidential information.",
      },
      {
        heading: "4. TERM",
        body: "This Agreement shall remain in effect for two (2) years from the date first written above. The obligations of confidentiality shall survive termination for a period of two (2) years.",
      },
      {
        heading: "5. NO LICENSE OR OBLIGATION",
        body: "Nothing in this Agreement grants either Party any license to the other Party's intellectual property. Neither Party is obligated to enter into any further agreement or business relationship.",
      },
      {
        heading: "6. RETURN OF INFORMATION",
        body: "Upon written request or termination of this Agreement, each Party shall promptly return or destroy all Confidential Information received from the other Party.",
      },
      {
        heading: "7. GOVERNING LAW",
        body: "This Agreement shall be governed by the laws of the State of {{STATE}}.\n\n\nPARTY A:\n{{COMPANY}}\n\nBy: _______________________________\nName: {{FOUNDER}}\nTitle: President\nDate: {{DATE}}\n\nPARTY B:\n\nBy: _______________________________\nName: ___________________________\nTitle: ___________________________\nDate: ___________________________",
      },
    ],
  },
  {
    id: "contractor-agreement",
    title: "Contractor Agreement",
    description:
      "Independent contractor agreement with IP assignment and confidentiality. Use for freelancers and consultants.",
    sections: [
      {
        heading: "INDEPENDENT CONTRACTOR AGREEMENT",
        body: "This Independent Contractor Agreement (\"Agreement\") is entered into as of {{DATE}} by and between {{COMPANY}}, a {{STATE}} corporation (the \"Company\"), and _________________________ (the \"Contractor\").",
      },
      {
        heading: "1. SERVICES",
        body: "1.1 Scope. The Contractor agrees to perform the services described in Exhibit A (the \"Services\") in a professional and workmanlike manner.\n\n1.2 Term. This Agreement shall commence on {{DATE}} and continue until the Services are completed, unless earlier terminated pursuant to Section 6.",
      },
      {
        heading: "2. COMPENSATION",
        body: "2.1 Fees. The Company shall pay the Contractor the fees set forth in Exhibit A.\n\n2.2 Invoicing. The Contractor shall submit invoices [monthly/upon completion], and the Company shall pay within 30 days of receipt.\n\n2.3 Expenses. The Contractor is responsible for all expenses incurred in performing the Services unless pre-approved in writing by the Company.",
      },
      {
        heading: "3. INDEPENDENT CONTRACTOR STATUS",
        body: "3.1 The Contractor is an independent contractor, not an employee, agent, or partner of the Company.\n\n3.2 The Contractor is solely responsible for all taxes, insurance, and benefits.\n\n3.3 The Contractor controls the manner and means of performing the Services, subject to the Company's general direction regarding the desired results.\n\n3.4 The Contractor is free to provide services to other clients, provided such services do not conflict with the Contractor's obligations under this Agreement.",
      },
      {
        heading: "4. INTELLECTUAL PROPERTY",
        body: "4.1 Work Product. All work product, deliverables, inventions, and materials created by the Contractor in the course of performing the Services (\"Work Product\") shall be the sole and exclusive property of the Company.\n\n4.2 Assignment. The Contractor hereby irrevocably assigns to the Company all right, title, and interest in the Work Product, including all intellectual property rights therein.\n\n4.3 Works Made for Hire. To the extent applicable, all Work Product shall be considered \"works made for hire\" under the Copyright Act.\n\n4.4 Further Assurances. The Contractor agrees to execute any documents necessary to perfect the Company's ownership of the Work Product.",
      },
      {
        heading: "5. CONFIDENTIALITY",
        body: "5.1 The Contractor agrees to hold all Confidential Information of the Company in strict confidence and not to disclose it to any third party.\n\n5.2 \"Confidential Information\" includes all non-public information about the Company's business, technology, customers, finances, and operations.\n\n5.3 This obligation survives termination of this Agreement for a period of two (2) years.",
      },
      {
        heading: "6. TERMINATION",
        body: "6.1 Either Party may terminate this Agreement with 14 days' written notice.\n\n6.2 The Company may terminate immediately for cause, including breach of this Agreement.\n\n6.3 Upon termination, the Contractor shall deliver all Work Product and return all Confidential Information.\n\n6.4 The Company shall pay for all Services satisfactorily performed through the date of termination.",
      },
      {
        heading: "7. GENERAL PROVISIONS",
        body: "7.1 Governing Law. This Agreement shall be governed by the laws of the State of {{STATE}}.\n\n7.2 Entire Agreement. This Agreement constitutes the entire agreement between the parties.\n\n7.3 Non-Solicitation. During the term and for 12 months after, the Contractor shall not solicit Company employees.\n\n\nCOMPANY:\n{{COMPANY}}\n\nBy: _______________________________\nName: {{FOUNDER}}\nTitle: President\n\nCONTRACTOR:\n\n_______________________________\nName: ___________________________\nDate: {{DATE}}",
      },
    ],
  },
  {
    id: "cofounder-agreement",
    title: "Co-Founder Agreement",
    description:
      "Defines equity split, roles, vesting, IP ownership, and decision-making between co-founders.",
    sections: [
      {
        heading: "CO-FOUNDER AGREEMENT",
        body: "This Co-Founder Agreement (\"Agreement\") is entered into as of {{DATE}} by and between the following individuals (each a \"Founder\" and collectively the \"Founders\"):\n\n1. {{FOUNDER}}\n2. _________________________\n\nin connection with the formation and operation of {{COMPANY}}, a {{STATE}} corporation (the \"Company\").",
      },
      {
        heading: "1. ROLES AND RESPONSIBILITIES",
        body: "1.1 {{FOUNDER}} shall serve as [CEO/CTO/etc.] and shall be responsible for [describe primary responsibilities].\n\n1.2 [Co-Founder Name] shall serve as [CEO/CTO/etc.] and shall be responsible for [describe primary responsibilities].\n\n1.3 Both Founders agree to devote their full-time efforts to the Company and not engage in any competing business without written consent of the other Founder.",
      },
      {
        heading: "2. EQUITY ALLOCATION",
        body: "2.1 The Founders shall receive the following equity in the Company:\n\n{{FOUNDER}}: [__]% of the initial shares\n[Co-Founder Name]: [__]% of the initial shares\n\n2.2 All shares are subject to the vesting provisions set forth in Section 3.\n\n2.3 Each Founder shall purchase their shares at the par value of $0.0001 per share pursuant to a separate Stock Purchase Agreement.",
      },
      {
        heading: "3. VESTING",
        body: "3.1 All Founder shares shall be subject to a four-year vesting schedule with a one-year cliff.\n\n3.2 25% of each Founder's shares shall vest on the one-year anniversary of the Vesting Commencement Date.\n\n3.3 The remaining 75% shall vest in equal monthly installments over the following 36 months.\n\n3.4 Vesting Commencement Date: {{DATE}}.\n\n3.5 If a Founder's service is terminated, the Company has the right to repurchase unvested shares at the original purchase price.",
      },
      {
        heading: "4. INTELLECTUAL PROPERTY",
        body: "4.1 Each Founder hereby assigns to the Company all intellectual property related to the Company's business that such Founder creates during the term of this Agreement.\n\n4.2 Each Founder represents that any intellectual property they bring into the Company that predates this Agreement is listed on Exhibit A.\n\n4.3 Each Founder shall execute a separate IP Assignment Agreement.",
      },
      {
        heading: "5. DECISION-MAKING",
        body: "5.1 Day-to-day operating decisions shall be made by the Founder responsible for that area per Section 1.\n\n5.2 The following decisions require unanimous consent of all Founders:\n\n(a) Raising capital or taking on debt\n(b) Hiring or terminating employees\n(c) Entering contracts over $[AMOUNT]\n(d) Changing the Company's business direction\n(e) Selling or licensing significant IP\n(f) Dissolving the Company\n\n5.3 In the event of deadlock, the Founders agree to engage a mutually agreed-upon mediator before taking legal action.",
      },
      {
        heading: "6. DEPARTURE",
        body: "6.1 Voluntary Departure. A Founder who voluntarily leaves shall forfeit all unvested shares.\n\n6.2 Termination for Cause. A Founder may be terminated for cause (fraud, felony, material breach) by unanimous vote of the remaining Founders, and shall forfeit all unvested shares.\n\n6.3 Right of First Refusal. Before selling vested shares, a departing Founder must first offer them to the Company and remaining Founders at fair market value.\n\n6.4 Non-Compete. A departing Founder agrees not to compete with the Company for 12 months after departure.",
      },
      {
        heading: "7. CONFIDENTIALITY",
        body: "Each Founder agrees to keep confidential all proprietary information of the Company, both during and after the term of this Agreement.",
      },
      {
        heading: "8. GENERAL PROVISIONS",
        body: "8.1 Governing Law. This Agreement shall be governed by the laws of the State of {{STATE}}.\n\n8.2 Entire Agreement. This Agreement constitutes the entire agreement between the Founders.\n\n8.3 Amendments. Amendments require written consent of all Founders.\n\n8.4 Severability. If any provision is found unenforceable, the remainder shall continue in effect.\n\n\nFOUNDER 1:\n\n_______________________________\n{{FOUNDER}}\nDate: {{DATE}}\n\nFOUNDER 2:\n\n_______________________________\nName: ___________________________\nDate: ___________________________",
      },
    ],
  },
];
