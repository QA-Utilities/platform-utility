export const MOCK_DEFAULT_INPUT = {
  id: "",
  uuid: "",
  name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  status: "",
  createdAt: "",
  amount: 0,
  active: false,
  address: {
    street: "",
    number: 0,
    zipcode: ""
  },
  tags: [""],
  notes: "{{sentence}}"
};

export const MOCK_RANDOM_DATA = {
  firstNames: ["Lucas", "Mariana", "Rafael", "Aline", "Joao", "Carla", "Tiago", "Ana"],
  lastNames: ["Silva", "Souza", "Costa", "Lima", "Santos", "Pereira", "Mendes", "Rocha"],
  cities: ["Sao Paulo", "Rio de Janeiro", "Curitiba", "Recife", "Porto", "Lisboa", "Austin", "Seattle"],
  states: ["SP", "RJ", "PR", "PE", "Porto", "Lisboa", "TX", "WA"],
  countries: ["Brasil", "Portugal", "Estados Unidos"],
  domains: ["empresa.com", "qa.local", "teste.dev", "mock.api"],
  companies: ["Acme", "NovaCore", "Atlas", "BluePeak", "Sigma", "Lumen"],
  statuses: ["active", "inactive", "pending", "approved", "blocked"],
  streets: ["Rua das Flores", "Avenida Central", "Rua do Sol", "Avenida Brasil", "Rua do Carmo"],
  words: [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "theta",
    "pipeline",
    "quality",
    "teste",
    "release",
    "deploy"
  ]
};

export const MOCK_TOKEN_HINTS = [
  "{{id}}",
  "{{uuid}}",
  "{{name}}",
  "{{email}}",
  "{{boolean}}",
  "{{date}}",
  "{{number:min:max}}",
  "{{word}}",
  "{{sentence}}",
  "{{city}}",
  "{{state}}",
  "{{country}}",
  "{{phone}}",
  "{{company}}",
  "{{status}}"
];

export const MOCK_KEY_HINTS = [
  "email",
  "name",
  "phone",
  "city",
  "state",
  "country",
  "status",
  "createdAt",
  "updatedAt",
  "amount",
  "price",
  "company",
  "address",
  "zip",
  "url",
  "token",
  "password"
];
