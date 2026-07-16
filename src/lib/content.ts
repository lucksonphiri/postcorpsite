export type ModuleKey = "slides"|"services"|"products"|"projects"|"news"|"gallery"|"testimonials"|"clients"|"downloads"|"vacancies"|"branches"|"faqs";
export const modules: Record<ModuleKey,{title:string;table:string;fields:string[]}> = {
 slides:{title:"Home Slides",table:"slides",fields:["title","subtitle","image_url","button_text","button_url","display_order","is_active"]},
 services:{title:"Services",table:"services",fields:["title","slug","summary","description","image_url","icon","display_order","is_featured","is_active"]},
 products:{title:"Products",table:"products",fields:["title","slug","category","summary","description","image_url","gallery_urls","features","is_featured","is_active"]},
 projects:{title:"Projects",table:"projects",fields:["title","slug","client","location","category","year","summary","description","image_url","gallery_urls","is_featured","is_active"]},
 news:{title:"News",table:"news",fields:["title","slug","excerpt","body","image_url","published_at","is_featured","is_active"]},
 gallery:{title:"Gallery",table:"gallery_items",fields:["title","category","image_url","description","display_order","is_active"]},
 testimonials:{title:"Testimonials",table:"testimonials",fields:["client_name","company","quote","image_url","display_order","is_active"]},
 clients:{title:"Clients",table:"clients",fields:["name","logo_url","website_url","display_order","is_active"]},
 downloads:{title:"Downloads",table:"downloads",fields:["title","category","file_url","description","display_order","is_active"]},
 vacancies:{title:"Vacancies",table:"vacancies",fields:["title","location","employment_type","description","requirements","deadline","is_active"]},
 branches:{title:"Branches",table:"branches",fields:["name","address","phone_primary","phone_secondary","email","map_url","display_order","is_active"]},
 faqs:{title:"FAQs / Chatbot",table:"faqs",fields:["question","answer","category","keywords","display_order","is_active"]}
};
export const safeModule=(m:string): ModuleKey|null => Object.prototype.hasOwnProperty.call(modules,m)?m as ModuleKey:null;
