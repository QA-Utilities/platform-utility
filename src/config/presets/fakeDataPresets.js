export const PERSON_PRESETS = {
  br: {
    label: "Brasil",
    firstNames: ["Lucas", "Mariana", "Thiago", "Camila", "Rafael", "Juliana", "Bruno", "Aline"],
    lastNames: ["Silva", "Souza", "Oliveira", "Costa", "Lima", "Santos", "Pereira", "Almeida"],
    streets: [
      "Rua das Flores",
      "Avenida Central",
      "Rua do Sol",
      "Avenida Brasil",
      "Rua das Acacias"
    ],
    districts: ["Centro", "Jardim Europa", "Boa Vista", "Vila Nova", "Bela Vista"],
    cities: ["Sao Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Recife"],
    states: ["SP", "RJ", "MG", "PR", "PE"],
    domains: ["teste.com.br", "emailfake.com.br", "qa.local.br"]
  },
  pt: {
    label: "Portugal",
    firstNames: ["Diogo", "Marta", "Joao", "Ines", "Tiago", "Ana", "Pedro", "Beatriz"],
    lastNames: ["Ferreira", "Santos", "Rodrigues", "Pereira", "Costa", "Martins", "Oliveira"],
    streets: ["Rua de Santa Maria", "Avenida da Liberdade", "Rua do Comercio", "Rua do Carmo"],
    cities: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro"],
    domains: ["teste.pt", "emailqa.pt", "fakebox.pt"]
  },
  us: {
    label: "EUA",
    firstNames: ["James", "Olivia", "Liam", "Sophia", "Noah", "Ava", "Ethan", "Mia"],
    lastNames: ["Smith", "Johnson", "Brown", "Miller", "Davis", "Wilson", "Anderson"],
    streets: ["Maple Street", "Sunset Avenue", "River Road", "Oak Lane", "Main Street"],
    cities: ["New York", "Los Angeles", "Austin", "Seattle", "Miami"],
    states: ["NY", "CA", "TX", "WA", "FL"],
    domains: ["testmail.us", "qa-fake.us", "samplebox.com"]
  }
};

export const CARD_BRANDS = {
  visa: {
    label: "Visa",
    prefixes: ["4"],
    length: 16,
    cvvLength: 3
  },
  mastercard: {
    label: "Mastercard",
    prefixes: ["51", "52", "53", "54", "55", "2221", "2720"],
    length: 16,
    cvvLength: 3
  },
  elo: {
    label: "Elo",
    prefixes: ["636368", "504175", "438935", "401178", "451416"],
    length: 16,
    cvvLength: 3
  },
  amex: {
    label: "American Express",
    prefixes: ["34", "37"],
    length: 15,
    cvvLength: 4
  }
};

export const VEHICLE_PRESETS = {
  br: {
    label: "Brasil",
    brands: {
      Fiat: ["Argo", "Mobi", "Pulse"],
      Volkswagen: ["Gol", "Polo", "Nivus"],
      Chevrolet: ["Onix", "Tracker", "Cruze"],
      Toyota: ["Corolla", "Yaris", "Hilux"],
      Honda: ["Civic", "City", "HR-V"]
    },
    colors: ["Preto", "Branco", "Prata", "Cinza", "Vermelho", "Azul"]
  },
  pt: {
    label: "Portugal",
    brands: {
      Peugeot: ["208", "2008", "3008"],
      Renault: ["Clio", "Captur", "Megane"],
      Volkswagen: ["Golf", "Polo", "T-Roc"],
      BMW: ["118i", "320d", "X1"],
      Mercedes: ["A180", "C200", "GLA 200"]
    },
    colors: ["Preto", "Branco", "Cinzento", "Azul", "Vermelho", "Prata"]
  },
  us: {
    label: "EUA",
    brands: {
      Ford: ["F-150", "Escape", "Mustang"],
      Chevrolet: ["Silverado", "Equinox", "Malibu"],
      Tesla: ["Model 3", "Model Y", "Model S"],
      Toyota: ["Camry", "RAV4", "Tacoma"],
      Dodge: ["Charger", "Durango", "Challenger"]
    },
    colors: ["Black", "White", "Silver", "Gray", "Blue", "Red"]
  }
};

export const COMPANY_PRESETS = {
  br: {
    label: "Brasil",
    prefixes: ["Alfa", "Nova", "Prime", "Global", "Atlas", "Vita", "Sigma"],
    cores: ["Tecnologia", "Logistica", "Alimentos", "Financeira", "Industrial", "Digital", "Comercio"],
    suffixes: ["LTDA", "S.A.", "ME", "EIRELI"],
    streets: ["Avenida Paulista", "Rua XV de Novembro", "Avenida Brasil", "Rua do Comercio"],
    cities: ["Sao Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Recife"],
    states: ["SP", "RJ", "PR", "MG", "PE"],
    domains: ["empresa.com.br", "corp.br", "negocio.com.br"]
  },
  pt: {
    label: "Portugal",
    prefixes: ["Luso", "Atlantica", "Norte", "Iberica", "Fenix", "Porto", "Tagus"],
    cores: ["Tech", "Servicos", "Comercio", "Industria", "Inovacao", "Logistica"],
    suffixes: ["LDA", "S.A."],
    streets: ["Avenida da Liberdade", "Rua do Comercio", "Rua de Santa Catarina", "Rua do Carmo"],
    cities: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro"],
    domains: ["empresa.pt", "negocio.pt", "corp.pt"]
  },
  us: {
    label: "EUA",
    prefixes: ["North", "Blue", "Peak", "Liberty", "Summit", "Golden", "Urban"],
    cores: ["Systems", "Holdings", "Logistics", "Foods", "Finance", "Technologies"],
    suffixes: ["LLC", "Inc.", "Corp."],
    streets: ["Main Street", "Market Street", "Broadway", "Sunset Boulevard"],
    cities: ["New York", "Austin", "Seattle", "Miami", "Los Angeles"],
    states: ["NY", "TX", "WA", "FL", "CA"],
    domains: ["company.us", "corp.com", "enterprise.us"]
  }
};

export const LABEL_OVERRIDES = {
  nome_completo: "Nome Completo",
  email: "Email",
  endereco: "Endereco",
  cep: "CEP",
  pais: "Pais",
  telefone: "Telefone",
  bandeira: "Bandeira",
  numero_cartao: "Numero do Cartao",
  validade: "Data de Validade",
  cvv: "CVV",
  marca: "Marca",
  modelo: "Modelo",
  ano: "Ano",
  cor: "Cor",
  placa: "Placa",
  renavam: "Renavam",
  matricula: "Matricula",
  vin: "VIN",
  license_plate: "License Plate",
  cpf: "CPF",
  rg: "RG",
  cnh: "CNH",
  nif: "NIF",
  niss: "NISS",
  cartao_cidadao: "Cartao de Cidadao",
  ssn: "SSN",
  driver_license: "Driver License",
  nome_empresa: "Nome da Empresa",
  data_fundacao: "Data de Fundacao",
  localizacao: "Localizacao",
  data_abertura: "Data de Abertura",
  cnpj: "CNPJ / Equivalente",
  inscricao_estadual: "Inscricao Estadual / Equivalente",
  tipo_documento_empresa: "Tipo Documento Empresa",
  tipo_inscricao_estadual: "Tipo Inscricao Estadual"
};
