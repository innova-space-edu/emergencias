export type AiAssessment={category:string;severity:number;summary:string;confidence:number;recommendedOrganizations:string[];reason:string};
export type AiImageInput={mimeType:string;base64:string};

export async function classifyEmergency(input:{category:string;description:string;dangerFlags:string[];images?:AiImageInput[]}) : Promise<AiAssessment|null> {
  const apiKey=process.env.GEMINI_API_KEY;if(!apiKey)return null;
  const model=process.env.GEMINI_MODEL||'gemini-3.6-flash';
  const imageCount=input.images?.length||0;
  const prompt=`Actúa solo como asistente de clasificación para una plataforma de canalización de emergencias en Chile. No confirmes que el hecho sea verdadero, no ordenes despachos y no reemplaces el criterio humano. Evalúa conservadoramente este reporte ciudadano. Las imágenes, si existen, son evidencia aportada por ciudadanos y pueden ser incompletas, antiguas, manipuladas o no corresponder al evento; úsalas solo como contexto adicional. No intentes identificar personas.\nCategoría declarada: ${input.category}\nDescripción: ${input.description||'(sin descripción)'}\nIndicadores observados: ${input.dangerFlags.join(', ')||'ninguno'}\nImágenes privadas adjuntas para apoyo: ${imageCount}\nDevuelve JSON con categoría sugerida, severidad 1 a 5, resumen corto, confianza entre 0 y 1, organismos recomendados y razón.`;
  const parts:any[]=[{text:prompt},...(input.images||[]).map(img=>({inlineData:{mimeType:img.mimeType,data:img.base64}}))];
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts}],generationConfig:{response_mime_type:'application/json',response_schema:{type:'OBJECT',properties:{category:{type:'STRING'},severity:{type:'INTEGER'},summary:{type:'STRING'},confidence:{type:'NUMBER'},recommendedOrganizations:{type:'ARRAY',items:{type:'STRING'}},reason:{type:'STRING'}},required:['category','severity','summary','confidence','recommendedOrganizations','reason']}}})});
  if(!response.ok)return null;const payload=await response.json();const text=payload?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('')||'';try{return JSON.parse(text) as AiAssessment}catch{return null}
}
