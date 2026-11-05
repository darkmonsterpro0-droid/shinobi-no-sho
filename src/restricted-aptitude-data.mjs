// Source-scoped catalogue and original summaries. Individual clan effects remain manual.
export const RESTRICTED_APTITUDES = [
  {
    "id": "res-basico-kikaichuu",
    "key": "res-basico-kikaichuu",
    "name": "Kikaichuu (Inseto Parasita Destruidor)",
    "kind": "cla",
    "origin": "aburame",
    "accessOrigins": [
      "aburame"
    ],
    "book": "basico",
    "page": 143,
    "pdfPage": 143,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Lidar com Animais 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Lidar com Animais 1",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 1,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Lidar com Animais 10",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 10,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Hospeda e comanda insetos que atacam e drenam chakra; possui evolução de controle.",
    "grantPlans": [],
    "resources": [
      {
        "key": "aburame.reserve",
        "label": "Grupos de insetos por espécie",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lidar com Animais 1",
      "Lidar com Animais 10"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-shokaichuu",
    "key": "res-basico-shokaichuu",
    "name": "Shōkaichuu (Inseto Parasita Rastreador)",
    "kind": "cla",
    "origin": "aburame",
    "accessOrigins": [
      "aburame"
    ],
    "book": "basico",
    "page": 144,
    "pdfPage": 144,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Lidar com Animais 6; Kikaichuu",
    "levels": [
      {
        "level": 1,
        "requirements": "Lidar com Animais 6; Kikaichuu",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 6,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            },
            {
              "fact": "aptitude.res-basico-kikaichuu",
              "label": "Aptidão: Kikaichuu (Inseto Parasita Destruidor)"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Mantém grupos independentes de insetos rastreadores de assinaturas de chakra.",
    "grantPlans": [],
    "resources": [
      {
        "key": "aburame.reserve",
        "label": "Grupos de insetos por espécie",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lidar com Animais 6; Kikaichuu"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-kidaichuu",
    "key": "res-basico-kidaichuu",
    "name": "Kidaichuu (Inseto Parasita Gigante)",
    "kind": "cla",
    "origin": "aburame",
    "accessOrigins": [
      "aburame"
    ],
    "book": "basico",
    "page": 145,
    "pdfPage": 145,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Lidar com Animais 12; Kikaichuu.",
    "levels": [
      {
        "level": 1,
        "requirements": "Lidar com Animais 12; Kikaichuu.",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 12,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            },
            {
              "fact": "aptitude.res-basico-kikaichuu",
              "label": "Aptidão: Kikaichuu (Inseto Parasita Destruidor)"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Utiliza insetos que drenam chakra, crescem e atuam como criaturas vinculadas.",
    "grantPlans": [],
    "resources": [
      {
        "key": "aburame.reserve",
        "label": "Grupos de insetos por espécie",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Incompatível com Rinkaichuu (Inseto Parasita Venenoso).",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lidar com Animais 12; Kikaichuu."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "incompatibleKeys": [
      "res-basico-rinkaichuu"
    ],
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-rinkaichuu",
    "key": "res-basico-rinkaichuu",
    "name": "Rinkaichuu (Inseto Parasita Venenoso)",
    "kind": "cla",
    "origin": "aburame",
    "accessOrigins": [
      "aburame"
    ],
    "book": "basico",
    "page": 146,
    "pdfPage": 146,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Lidar com Animais 12; Kikaichuu.",
    "levels": [
      {
        "level": 1,
        "requirements": "Lidar com Animais 12; Kikaichuu.",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 12,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            },
            {
              "fact": "aptitude.res-basico-kikaichuu",
              "label": "Aptidão: Kikaichuu (Inseto Parasita Destruidor)"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Utiliza grupos de insetos venenosos transferidos por contato físico.",
    "grantPlans": [],
    "resources": [
      {
        "key": "aburame.reserve",
        "label": "Grupos de insetos por espécie",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Incompatível com Kidaichuu (Inseto Parasita Gigante).",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lidar com Animais 12; Kikaichuu."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "incompatibleKeys": [
      "res-basico-kidaichuu"
    ],
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-corpulencia",
    "key": "res-basico-corpulencia",
    "name": "Corpulência",
    "kind": "cla",
    "origin": "akimichi",
    "accessOrigins": [
      "akimichi"
    ],
    "book": "basico",
    "page": 150,
    "pdfPage": 150,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Amplia Vitalidade e resistência de Vigor; permite converter reservas corporais em chakra.",
    "grantPlans": [],
    "resources": [
      {
        "key": "akimichi.reserve",
        "label": "Reserva corporal / usos de Corpulência",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-resiliencia",
    "key": "res-basico-resiliencia",
    "name": "Resiliência",
    "kind": "cla",
    "origin": "akimichi",
    "accessOrigins": [
      "akimichi"
    ],
    "book": "basico",
    "page": 151,
    "pdfPage": 151,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Obtém dureza corporal escalonada por Vigor, com penalidades de movimento e precisão.",
    "grantPlans": [],
    "resources": [
      {
        "key": "akimichi.reserve",
        "label": "Reserva corporal / usos de Corpulência",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-presa-de-prata",
    "key": "res-basico-presa-de-prata",
    "name": "Presa De Prata",
    "kind": "especial",
    "origin": "hatake",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 155,
    "pdfPage": 155,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Tensai (Hijutsu)",
    "levels": [
      {
        "level": 1,
        "requirements": "Tensai (Hijutsu)",
        "checks": {
          "all": [
            {
              "review": "Conferir: Tensai (Hijutsu)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proficiência na espada característica, um Domínio Elemental e Maestria escolhida.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Tensai (Hijutsu)"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-byakugan",
    "key": "res-basico-byakugan",
    "name": "Byakugan",
    "kind": "cla",
    "origin": "hyuuga",
    "accessOrigins": [
      "hyuuga"
    ],
    "book": "basico",
    "page": 157,
    "pdfPage": 157,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Percepção 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 1",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 1,
              "label": "Percepção"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Ativa percepção ampliada de chakra e visão especial; efeitos dependem do contexto.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-tenketsu-byakugan",
    "key": "res-basico-tenketsu-byakugan",
    "name": "Tenketsu Byakugan",
    "kind": "cla",
    "origin": "hyuuga",
    "accessOrigins": [
      "hyuuga"
    ],
    "book": "basico",
    "page": 158,
    "pdfPage": 158,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Byakugan; Procurar 7; Prontidão 7; Rastrear 7",
    "levels": [
      {
        "level": 1,
        "requirements": "Byakugan; Procurar 7; Prontidão 7; Rastrear 7",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-basico-byakugan",
              "label": "Aptidão: Byakugan"
            },
            {
              "fact": "skill.procurar",
              "min": 7,
              "label": "Procurar"
            },
            {
              "fact": "skill.prontidao",
              "min": 7,
              "label": "Prontidão"
            },
            {
              "fact": "skill.rastrear",
              "min": 7,
              "label": "Rastrear"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia Byakugan e permite interferência nos tenketsus com ataques Juuken.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Byakugan; Procurar 7; Prontidão 7; Rastrear 7"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-companheiro-animal",
    "key": "res-basico-companheiro-animal",
    "name": "Companheiro Animal",
    "kind": "cla",
    "origin": "inuzuka",
    "accessOrigins": [
      "inuzuka"
    ],
    "book": "basico",
    "page": 163,
    "pdfPage": 163,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Lidar com Animais 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Lidar com Animais 1",
        "checks": {
          "all": [
            {
              "fact": "skill.lidar",
              "min": 1,
              "label": "Lidar com Animais"
            },
            {
              "fact": "training.lidar",
              "min": 1,
              "label": "Ponto investido em Lidar com Animais"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Vincula um parceiro canino com ficha e regras próprias.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lidar com Animais 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-hakken-no-jutsu",
    "key": "res-basico-hakken-no-jutsu",
    "name": "Hakken No Jutsu (Técnica De Detecção)",
    "kind": "cla",
    "origin": "inuzuka",
    "accessOrigins": [
      "inuzuka"
    ],
    "book": "basico",
    "page": 164,
    "pdfPage": 164,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rastrear 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Rastrear 1",
        "checks": {
          "all": [
            {
              "fact": "skill.rastrear",
              "min": 1,
              "label": "Rastrear"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Amplia o olfato para detecção, com alcance e capacidades condicionais.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rastrear 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-vontade-do-fogo",
    "key": "res-basico-vontade-do-fogo",
    "name": "Vontade Do Fogo",
    "kind": "especial",
    "origin": "sarutobi",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 174,
    "pdfPage": 174,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Tensai (Hijutsu), Vigor 6, Resistência Maior (Vigor) e Clone Verdadeiro (Kage Bunshin).",
    "levels": [
      {
        "level": 1,
        "requirements": "Tensai (Hijutsu), Vigor 6, Resistência Maior (Vigor) e Clone Verdadeiro (Kage Bunshin).",
        "checks": {
          "all": [
            {
              "fact": "attribute.vig",
              "min": 6,
              "label": "Vigor"
            },
            {
              "review": "Conferir: Tensai (Hijutsu); Resistência Maior (Vigor) e Clone Verdadeiro (Kage Bunshin)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede Duro de Matar, longevidade e exceção para clones verdadeiros.",
    "grantPlans": [
      {
        "benefitKey": "duro-de-matar",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Tensai (Hijutsu), Vigor 6, Resistência Maior (Vigor) e Clone Verdadeiro (Kage Bunshin)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-maximizar",
    "key": "res-basico-maximizar",
    "name": "Maximizar",
    "kind": "especial",
    "origin": "senju",
    "accessOrigins": [
      "senju",
      "tensai"
    ],
    "book": "basico",
    "page": 175,
    "pdfPage": 175,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Espírito ou Inteligência 15; Potencializar (aptidão)",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito ou Inteligência 15; Potencializar (aptidão)",
        "checks": {
          "all": [
            {
              "fact": "aptitude.potencializar",
              "label": "Aptidão: potencializar"
            },
            {
              "review": "Conferir: Espírito ou Inteligência 15"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite combinar os benefícios de Potencializar para o elemento escolhido.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito ou Inteligência 15; Potencializar (aptidão)"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-elemento-natural-katon",
    "key": "res-basico-elemento-natural-katon",
    "name": "Elemento Natural: Katon",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "basico",
    "page": 180,
    "pdfPage": 180,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Espírito 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 1",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 1,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Libera um uso específico de Sopro Destrutivo Katon, com parâmetros próprios.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-sharingan",
    "key": "res-basico-sharingan",
    "name": "Sharingan",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "basico",
    "page": 181,
    "pdfPage": 181,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Percepção 3",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 3",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 3,
              "label": "Percepção"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Ativa visão especial; percepção, interpretação de ações e limitações próprias.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 3"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-nidan-sharingan",
    "key": "res-basico-nidan-sharingan",
    "name": "Nidan Sharingan",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "basico",
    "page": 182,
    "pdfPage": 182,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Percepção 6, Sharingan",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 6, Sharingan",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 6,
              "label": "Percepção"
            },
            {
              "fact": "aptitude.res-basico-sharingan",
              "label": "Aptidão: Sharingan"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia Sharingan; prevê benefícios de Intuição e visão acelerada.",
    "grantPlans": [
      {
        "benefitKey": "intuicao",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 6, Sharingan"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-sandan-sharingan",
    "key": "res-basico-sandan-sharingan",
    "name": "Sandan Sharingan",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "basico",
    "page": 182,
    "pdfPage": 182,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Percepção 9; Nidan Sharingan",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 9; Nidan Sharingan",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 9,
              "label": "Percepção"
            },
            {
              "fact": "aptitude.res-basico-nidan-sharingan",
              "label": "Aptidão: Nidan Sharingan"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia Sharingan e dá acesso às técnicas de Hipnose Sharingan.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 9; Nidan Sharingan"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-mangekyou-sharingan",
    "key": "res-basico-mangekyou-sharingan",
    "name": "Mangekyou Sharingan",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "basico",
    "page": 183,
    "pdfPage": 183,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Percepção 16; Sandan Sharingan; um evento traumático.",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 16; Sandan Sharingan; um evento traumático.",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 16,
              "label": "Percepção"
            },
            {
              "fact": "aptitude.res-basico-sandan-sharingan",
              "label": "Aptidão: Sandan Sharingan"
            },
            {
              "review": "Conferir: um evento traumático"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Libera técnicas especiais escolhidas com limitações e perda de visão.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 16; Sandan Sharingan; um evento traumático."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-regeneracao",
    "key": "res-basico-regeneracao",
    "name": "Regeneração",
    "kind": "cla",
    "origin": "uzumaki",
    "accessOrigins": [
      "uzumaki",
      "kaguya",
      "jashin-juusha"
    ],
    "book": "basico",
    "page": 193,
    "pdfPage": 193,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Melhora recuperação de sangramento e ferimentos conforme condições da regra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-chakra-expandido",
    "key": "res-basico-chakra-expandido",
    "name": "Chakra Expandido",
    "kind": "cla",
    "origin": "uzumaki",
    "accessOrigins": [
      "uzumaki",
      "hoshigaki",
      "hoshigakure"
    ],
    "book": "basico",
    "page": 193,
    "pdfPage": 193,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Amplia o máximo de chakra; benefício apenas catalogado nesta etapa.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "originVariants": {
      "uzumaki": [
        "option1"
      ]
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-mil-clones",
    "key": "res-basico-mil-clones",
    "name": "Mil Clones",
    "kind": "cla",
    "origin": "uzumaki",
    "accessOrigins": [
      "uzumaki"
    ],
    "book": "basico",
    "page": 193,
    "pdfPage": 193,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Espírito 10; Chakra Expandido; Clone nível 2; Clone Verdadeiro (Kage Bunshin).",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 10; Chakra Expandido; Clone nível 2; Clone Verdadeiro (Kage Bunshin).",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 10,
              "label": "Espírito"
            },
            {
              "fact": "aptitude.res-basico-chakra-expandido",
              "label": "Aptidão: Chakra Expandido"
            },
            {
              "review": "Conferir: Clone nível 2; Clone Verdadeiro (Kage Bunshin)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Altera limites e divisão de recursos para Kage Bunshins.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 10; Chakra Expandido; Clone nível 2; Clone Verdadeiro (Kage Bunshin)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "originVariants": {
      "uzumaki": [
        "option1"
      ]
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-kongou-fuusa",
    "key": "res-basico-kongou-fuusa",
    "name": "Kongou Fuusa",
    "kind": "cla",
    "origin": "uzumaki",
    "accessOrigins": [
      "uzumaki"
    ],
    "book": "basico",
    "page": 195,
    "pdfPage": 195,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Espírito 14",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 14",
        "checks": {
          "fact": "attribute.esp",
          "min": 14,
          "label": "Espírito"
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite correntes de chakra para ataque e contenção.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 14"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-estilo-da-lotus",
    "key": "res-basico-estilo-da-lotus",
    "name": "Estilo Da Lótus",
    "kind": "hijutsu",
    "origin": "hachimon-tonkou",
    "accessOrigins": [
      "hachimon-tonkou"
    ],
    "book": "basico",
    "page": 207,
    "pdfPage": 207,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Hachimon 1.",
    "levels": [
      {
        "level": 1,
        "requirements": "Hachimon 1.",
        "checks": {
          "all": [
            {
              "fact": "power.hachimon",
              "min": 1,
              "label": "Poder hachimon"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede duas manobras escolhidas, condicionadas ao uso de Hachimon.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Hachimon 1."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-ilusao-fluida",
    "key": "res-basico-ilusao-fluida",
    "name": "Ilusão Fluida [Meta]",
    "kind": "hijutsu",
    "origin": "magen",
    "accessOrigins": [
      "magen"
    ],
    "book": "basico",
    "page": 238,
    "pdfPage": 238,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Inteligência 12; Magen 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Inteligência 12; Magen 6",
        "checks": {
          "all": [
            {
              "fact": "attribute.int",
              "min": 12,
              "label": "Inteligência"
            },
            {
              "fact": "power.magen",
              "min": 6,
              "label": "Poder magen"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Altera o parâmetro de dificuldade de uma ilusão conforme a Inteligência do alvo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Inteligência 12; Magen 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-aprendizagem-rapida",
    "key": "res-basico-aprendizagem-rapida",
    "name": "Aprendizagem Rápida",
    "kind": "hijutsu",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 243,
    "pdfPage": 243,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Versatilidade 5.",
    "levels": [
      {
        "level": 1,
        "requirements": "Versatilidade 5.",
        "checks": {
          "all": [
            {
              "fact": "power.versatilidade",
              "min": 5,
              "label": "Poder versatilidade"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite novas compras de Versatilidade com pares adicionais de poderes.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Versatilidade 5."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": true,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-talento-natural",
    "key": "res-basico-talento-natural",
    "name": "Talento Natural",
    "kind": "hijutsu",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 243,
    "pdfPage": 243,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Inteligência ou Espírito 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Inteligência ou Espírito 6",
        "checks": {
          "all": [
            {
              "review": "Conferir: Inteligência ou Espírito 6"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede um efeito compatível e suas evoluções a um poder selecionado.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Inteligência ou Espírito 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-tecnica-avancada",
    "key": "res-basico-tecnica-avancada",
    "name": "Técnica Avançada",
    "kind": "hijutsu",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 243,
    "pdfPage": 243,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Atender aos requisitos das aptidões recebidas.",
    "levels": [
      {
        "level": 1,
        "requirements": "Atender aos requisitos das aptidões recebidas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Atender aos requisitos das aptidões recebidas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede duas aptidões de técnica cujos requisitos sejam atendidos.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Atender aos requisitos das aptidões recebidas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-capacidade",
    "key": "res-basico-capacidade",
    "name": "Capacidade",
    "kind": "especial",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 244,
    "pdfPage": 244,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Espírito 8",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 8",
        "checks": {
          "fact": "attribute.esp",
          "min": 8,
          "label": "attribute.esp"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Espírito 12",
        "checks": {
          "fact": "attribute.esp",
          "min": 12,
          "label": "attribute.esp"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Melhora dano de poderes compatíveis; evolução modifica a ação de meta-aptidões.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 8",
      "Espírito 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-controle-perfeito",
    "key": "res-basico-controle-perfeito",
    "name": "Controle Perfeito",
    "kind": "especial",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 244,
    "pdfPage": 244,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Inteligência 8",
    "levels": [
      {
        "level": 1,
        "requirements": "Inteligência 8",
        "checks": {
          "fact": "attribute.int",
          "min": 8,
          "label": "attribute.int"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Inteligência 12",
        "checks": {
          "fact": "attribute.int",
          "min": 12,
          "label": "attribute.int"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite substituir parâmetros de Espírito por Inteligência; evolução amplia chakra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Inteligência 8",
      "Inteligência 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-instinto-de-batalha",
    "key": "res-basico-instinto-de-batalha",
    "name": "Instinto De Batalha",
    "kind": "especial",
    "origin": "tensai",
    "accessOrigins": [
      "tensai",
      "buki-senmon"
    ],
    "book": "basico",
    "page": 244,
    "pdfPage": 244,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Destreza ou Agilidade 8; escolha de base compatível",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza ou Agilidade 8; escolha de base compatível",
        "checks": {
          "any": [
            {
              "fact": "attribute.des",
              "min": 8,
              "label": "attribute.des"
            },
            {
              "fact": "attribute.agi",
              "min": 8,
              "label": "attribute.agi"
            }
          ]
        },
        "review": true,
        "reviewReason": "Conferir a base escolhida e a restrição de base 5.",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Destreza ou Agilidade 12",
        "checks": {
          "any": [
            {
              "fact": "attribute.des",
              "min": 12,
              "label": "attribute.des"
            },
            {
              "fact": "attribute.agi",
              "min": 12,
              "label": "attribute.agi"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica uma base de combate escolhida; evolução altera o limite de penalidade.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza ou Agilidade 8; escolha de base compatível",
      "Destreza ou Agilidade 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-deus-do-trovao",
    "key": "res-basico-deus-do-trovao",
    "name": "Deus Do Trovão",
    "kind": "especial",
    "origin": "tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "basico",
    "page": 244,
    "pdfPage": 244,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Fuuinjutsu 8; Inteligência 14",
    "levels": [
      {
        "level": 1,
        "requirements": "Fuuinjutsu 8; Inteligência 14",
        "checks": {
          "all": [
            {
              "fact": "power.fuuinjutsu",
              "min": 8,
              "label": "Poder fuuinjutsu"
            },
            {
              "fact": "attribute.int",
              "min": 14,
              "label": "attribute.int"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Inteligência 18",
        "checks": {
          "fact": "attribute.int",
          "min": 18,
          "label": "attribute.int"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Dá acesso às técnicas Hiraishin e, na evolução, Hiraishin: Dorai.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Fuuinjutsu 8; Inteligência 14",
      "Inteligência 18"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-disparos-sujos",
    "key": "res-avancado-disparos-sujos",
    "name": "Disparos Sujos",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 14,
    "pdfPage": 15,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Especialista: Armas de Fogo; Combate à Distância 11; Inteligência 3.",
    "levels": [
      {
        "level": 1,
        "requirements": "Especialista: Armas de Fogo; Combate à Distância 11; Inteligência 3.",
        "checks": {
          "all": [
            {
              "fact": "combat.cd",
              "min": 11,
              "label": "Combate à Distância"
            },
            {
              "fact": "attribute.int",
              "min": 3,
              "label": "Inteligência"
            },
            {
              "review": "Conferir: Especialista: Armas de Fogo"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede manobras de disparo e modifica sua relação com o dano.",
    "grantPlans": [
      {
        "benefitKey": "desarme-a-distancia",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      },
      {
        "benefitKey": "flechada-no-joelho",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Especialista: Armas de Fogo; Combate à Distância 11; Inteligência 3.",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-recarga-precisa",
    "key": "res-avancado-recarga-precisa",
    "name": "Recarga Precisa",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 14,
    "pdfPage": 15,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Destreza 9; Usar Pólvora; Saque Rápido.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 9; Usar Pólvora; Saque Rápido.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 9,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.usar-polvora",
              "label": "Aptidão: usar-polvora"
            },
            {
              "fact": "aptitude.saque-rapido",
              "label": "Aptidão: saque-rapido"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite simulação de dado na recarga rápida de armas elegíveis.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 9; Usar Pólvora; Saque Rápido."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-gun-fu",
    "key": "res-avancado-gun-fu",
    "name": "Gun Fu",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 14,
    "pdfPage": 15,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Destreza 11; Especialista: Armas de Fogo; Guerreiro.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 11; Especialista: Armas de Fogo; Guerreiro.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 11,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.guerreiro",
              "label": "Aptidão: guerreiro"
            },
            {
              "review": "Conferir: Especialista: Armas de Fogo"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia defesas e manobras com armas de fogo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 11; Especialista: Armas de Fogo; Guerreiro."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-mira-vital",
    "key": "res-avancado-mira-vital",
    "name": "Mira Vital",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 15,
    "pdfPage": 16,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Destreza 12; Mira Apurada.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 12; Mira Apurada.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 12,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.mira-apurada",
              "label": "Aptidão: mira-apurada"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Melhora o grau de dano ao usar Mira Apurada, com exclusões.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 12; Mira Apurada."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-armamento-pesado",
    "key": "res-avancado-armamento-pesado",
    "name": "Armamento Pesado",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 15,
    "pdfPage": 16,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Mecanismo 12; Especialista: Armas de Fogo.",
    "levels": [
      {
        "level": 1,
        "requirements": "Mecanismo 12; Especialista: Armas de Fogo.",
        "checks": {
          "all": [
            {
              "fact": "skill.mecanismos",
              "min": 12,
              "label": "Mecanismo"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismo"
            },
            {
              "review": "Conferir: Especialista: Armas de Fogo"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite modificar armas de fogo, alterando dano e requisitos.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Mecanismo 12; Especialista: Armas de Fogo."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-alcance-extendido",
    "key": "res-avancado-alcance-extendido",
    "name": "Alcance Extendido",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 15,
    "pdfPage": 16,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Percepção 12; Tiro Longo.",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 12; Tiro Longo.",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 12,
              "label": "Percepção"
            },
            {
              "fact": "aptitude.tiro-longo",
              "label": "Aptidão: tiro-longo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia o alcance de armas de fogo sem multiplicação por Tiro Longo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 12; Tiro Longo."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-atirador-agil",
    "key": "res-avancado-atirador-agil",
    "name": "Atirador Agil",
    "kind": "hijutsu",
    "origin": "saika-ikki",
    "accessOrigins": [
      "saika-ikki"
    ],
    "book": "avancado",
    "page": 15,
    "pdfPage": 16,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Agilidade 12; Retirada Rápida.",
    "levels": [
      {
        "level": 1,
        "requirements": "Agilidade 12; Retirada Rápida.",
        "checks": {
          "all": [
            {
              "fact": "attribute.agi",
              "min": 12,
              "label": "Agilidade"
            },
            {
              "fact": "aptitude.retirada-rapida",
              "label": "Aptidão: retirada-rapida"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Reduz a combinação de ações de Retirada Rápida com arma de fogo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Agilidade 12; Retirada Rápida."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-avancado-senjutsu",
    "key": "res-avancado-senjutsu",
    "name": "Senjutsu (Técnica Eremita)",
    "kind": "hijutsu",
    "origin": "senjutsu",
    "accessOrigins": [
      "senjutsu"
    ],
    "book": "avancado",
    "page": 16,
    "pdfPage": 17,
    "edition": "10 anos / 2026",
    "category": "Restrita",
    "requirements": "Vigor e Espírito 10; (Kuchyiose Restrito 7) ou (Mokuton 7 e Regeneração) (Ver texto)",
    "levels": [
      {
        "level": 1,
        "requirements": "Vigor e Espírito 10; (Kuchyiose Restrito 7) ou (Mokuton 7 e Regeneração) (Ver texto)",
        "checks": {
          "all": [
            {
              "review": "Conferir: Vigor e Espírito 10; (Kuchyiose Restrito 7) ou (Mokuton 7 e Regeneração) (Ver texto)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir dependências, progressão e exceções do Senjutsu revisado."
      },
      {
        "level": 2,
        "requirements": "o Senjutsu é de difícil acesso e poucos são os que conseguem aprendê-lo e dominá-lo. Mesmo aqueles que podem ser ensinados às vezes não são aptos fisicamente a suportar a energia da natureza. Para comprar este poder, você deve ter Vigor e Espírito 10 e cumprir um dos seguintes pré-requisitos:",
        "checks": {
          "all": [
            {
              "review": "Conferir: o Senjutsu é de difícil acesso e poucos são os que conseguem aprendê-lo e dominá-lo. Mesmo aqueles que podem ser ensinados às vezes não são aptos fisicamente a suportar a energia da natureza. Para comprar este poder; você deve ter Vigor e Espírito 10 e cumprir um dos seguintes pré-requisitos:"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir dependências, progressão e exceções do Senjutsu revisado."
      },
      {
        "level": 3,
        "requirements": "Conferir os requisitos de evolução na fonte.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Conferir os requisitos de evolução na fonte"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir dependências, progressão e exceções do Senjutsu revisado."
      }
    ],
    "maxLevel": 3,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Linha revisada de aptidões que prepara o Modo Eremita e uma reserva natural.",
    "grantPlans": [],
    "resources": [
      {
        "key": "senjutsu.reserve",
        "label": "Chakra Senjutsu",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Revisão do Guia: aptidão; no Básico é Poder. Não converter registros antigos.",
      "Acesso complementar e exceções de transplante/Lesmas exigem conferência.",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Vigor e Espírito 10; (Kuchyiose Restrito 7) ou (Mokuton 7 e Regeneração) (Ver texto)",
      "o Senjutsu é de difícil acesso e poucos são os que conseguem aprendê-lo e dominá-lo. Mesmo aqueles que podem ser ensinados às vezes não são aptos fisicamente a suportar a energia da natureza. Para comprar este poder, você deve ter Vigor e Espírito 10 e cumprir um dos seguintes pré-requisitos:",
      "Conferir os requisitos de evolução na fonte."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "variant": {
      "setting": "senjutsu",
      "value": "revisado",
      "label": "Senjutsu revisado do Guia"
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-elemento-natural-fuuton",
    "key": "res-hijutsus2-elemento-natural-fuuton",
    "name": "Elemento Natural: Fuuton",
    "kind": "cla",
    "origin": "shimura",
    "accessOrigins": [
      "shimura"
    ],
    "book": "hijutsus2",
    "page": 8,
    "pdfPage": 9,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 1; Fuuton 1.",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 1; Fuuton 1.",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 1,
              "label": "Espírito"
            },
            {
              "fact": "power.fuuton",
              "min": 1,
              "label": "Poder fuuton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Melhora penetração de dureza de efeitos Fuuton, com exceções.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 1; Fuuton 1."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-izanagi",
    "key": "res-hijutsus2-izanagi",
    "name": "Izanagi",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "hijutsus2",
    "page": 11,
    "pdfPage": 12,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Sandan Sharingan; Inteligência 14; somente para PdM.",
    "levels": [
      {
        "level": 1,
        "requirements": "Sandan Sharingan; Inteligência 14; somente para PdM.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-basico-sandan-sharingan",
              "label": "Aptidão: Sandan Sharingan"
            },
            {
              "fact": "attribute.int",
              "min": 14,
              "label": "Inteligência"
            },
            {
              "review": "Conferir: somente para PdM"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite usos especiais de Falsa Morte, com perda de um olho; restrita a PdM.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Sandan Sharingan; Inteligência 14; somente para PdM."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-izanami",
    "key": "res-hijutsus2-izanami",
    "name": "Izanami",
    "kind": "cla",
    "origin": "uchiha",
    "accessOrigins": [
      "uchiha"
    ],
    "book": "hijutsus2",
    "page": 13,
    "pdfPage": 14,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Sandan Sharingan; Inteligência 14; somente para PdM.",
    "levels": [
      {
        "level": 1,
        "requirements": "Sandan Sharingan; Inteligência 14; somente para PdM.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-basico-sandan-sharingan",
              "label": "Aptidão: Sandan Sharingan"
            },
            {
              "fact": "attribute.int",
              "min": 14,
              "label": "Inteligência"
            },
            {
              "review": "Conferir: somente para PdM"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Estabelece uma ilusão especial com condições e selamento ocular; restrita a PdM.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Sandan Sharingan; Inteligência 14; somente para PdM."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-regeneracao-de-vigor",
    "key": "res-hijutsus2-regeneracao-de-vigor",
    "name": "Regeneração De Vigor",
    "kind": "cla",
    "origin": "uzumaki",
    "accessOrigins": [
      "uzumaki"
    ],
    "book": "hijutsus2",
    "page": 13,
    "pdfPage": 14,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Vigor 1, Espírito 3.",
    "levels": [
      {
        "level": 1,
        "requirements": "Vigor 1, Espírito 3.",
        "checks": {
          "all": [
            {
              "fact": "attribute.vig",
              "min": 1,
              "label": "Vigor"
            },
            {
              "fact": "attribute.esp",
              "min": 3,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite cura de um aliado por mordida, com custos no usuário.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Vigor 1, Espírito 3."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "originVariants": {
      "uzumaki": [
        "option2"
      ]
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kujaku-myoho-cura",
    "key": "res-hijutsus2-kujaku-myoho-cura",
    "name": "Kujaku Myoho: Cura",
    "kind": "cla",
    "origin": "hoshigakure",
    "accessOrigins": [
      "hoshigakure"
    ],
    "book": "hijutsus2",
    "page": 16,
    "pdfPage": 17,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ninja Médico (aptidão); Kujaku Myoho 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Ninja Médico (aptidão); Kujaku Myoho 5",
        "checks": {
          "all": [
            {
              "fact": "aptitude.ninja-medico",
              "label": "Aptidão: ninja-medico"
            },
            {
              "fact": "power.kujaku-myoho",
              "min": 5,
              "label": "Poder kujaku-myoho"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite tratamento de ferimentos com chakra do Kujaku Myoho.",
    "grantPlans": [],
    "resources": [
      {
        "key": "hoshigakure.reserve",
        "label": "Saúde de Kujaku Myoho",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ninja Médico (aptidão); Kujaku Myoho 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kujaku-myoho-saimin",
    "key": "res-hijutsus2-kujaku-myoho-saimin",
    "name": "Kujaku Myoho: Saimin (Hipnotismo)",
    "kind": "cla",
    "origin": "hoshigakure",
    "accessOrigins": [
      "hoshigakure"
    ],
    "book": "hijutsus2",
    "page": 17,
    "pdfPage": 18,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Inteligência 4; Kujaku Myoho 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Inteligência 4; Kujaku Myoho 1",
        "checks": {
          "all": [
            {
              "fact": "attribute.int",
              "min": 4,
              "label": "Inteligência"
            },
            {
              "fact": "power.kujaku-myoho",
              "min": 1,
              "label": "Poder kujaku-myoho"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Aplica uma forma de hipnotismo baseada em Kujaku Myoho.",
    "grantPlans": [],
    "resources": [
      {
        "key": "hoshigakure.reserve",
        "label": "Saúde de Kujaku Myoho",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Inteligência 4; Kujaku Myoho 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kujaku-myoho-sacrificio",
    "key": "res-hijutsus2-kujaku-myoho-sacrificio",
    "name": "Kujaku Myoho: Sacrifício",
    "kind": "cla",
    "origin": "hoshigakure",
    "accessOrigins": [
      "hoshigakure"
    ],
    "book": "hijutsus2",
    "page": 17,
    "pdfPage": 18,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Kujaku Myoho 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Kujaku Myoho 5",
        "checks": {
          "all": [
            {
              "fact": "power.kujaku-myoho",
              "min": 5,
              "label": "Poder kujaku-myoho"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite trocar Saúde por melhoria de dano e dificuldade de Kujaku Myoho.",
    "grantPlans": [],
    "resources": [
      {
        "key": "hoshigakure.reserve",
        "label": "Saúde de Kujaku Myoho",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kujaku Myoho 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-demolicao",
    "key": "res-hijutsus2-demolicao",
    "name": "Demolição",
    "kind": "hijutsu",
    "origin": "bakuton",
    "accessOrigins": [
      "bakuton"
    ],
    "book": "hijutsus2",
    "page": 19,
    "pdfPage": 20,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Bakuton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Bakuton 5",
        "checks": {
          "fact": "power.bakuton",
          "min": 5,
          "label": "Poder bakuton"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Bakuton 8",
        "checks": {
          "fact": "power.bakuton",
          "min": 8,
          "label": "Poder bakuton"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Melhora a destruição de proteções por Bakuton e possui evolução.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Bakuton 5",
      "Bakuton 8"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-usar-arma-arsenal",
    "key": "res-hijutsus2-usar-arma-arsenal",
    "name": "Usar Arma: Arsenal",
    "kind": "hijutsu",
    "origin": "buki-senmon",
    "accessOrigins": [
      "buki-senmon"
    ],
    "book": "hijutsus2",
    "page": 22,
    "pdfPage": 23,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Destreza 8",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 8",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 8,
              "label": "Destreza"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proficiência marcial ampla, preservando exigências físicas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 8"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-acuidade-perfeita",
    "key": "res-hijutsus2-acuidade-perfeita",
    "name": "Acuidade Perfeita",
    "kind": "hijutsu",
    "origin": "buki-senmon",
    "accessOrigins": [
      "buki-senmon"
    ],
    "book": "hijutsus2",
    "page": 23,
    "pdfPage": 24,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Destreza 8; Acuidade; Usar Arma: Arsenal.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 8; Acuidade; Usar Arma: Arsenal.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 8,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.acuidade",
              "label": "Aptidão: acuidade"
            },
            {
              "fact": "aptitude.res-hijutsus2-usar-arma-arsenal",
              "label": "Aptidão: Usar Arma: Arsenal"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite Destreza nos requisitos e no uso de armas compatíveis.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 8; Acuidade; Usar Arma: Arsenal."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-arsenal-completo",
    "key": "res-hijutsus2-arsenal-completo",
    "name": "Arsenal Completo",
    "kind": "hijutsu",
    "origin": "buki-senmon",
    "accessOrigins": [
      "buki-senmon"
    ],
    "book": "hijutsus2",
    "page": 23,
    "pdfPage": 24,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Usar Arma: Arsenal; Criar Arma ou Fuuinjutsu 2",
    "levels": [
      {
        "level": 1,
        "requirements": "Usar Arma: Arsenal; Criar Arma ou Fuuinjutsu 2",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-usar-arma-arsenal",
              "label": "Aptidão: Usar Arma: Arsenal"
            },
            {
              "review": "Conferir: Criar Arma ou Fuuinjutsu 2"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite manter arsenal não especial com regras próprias de armazenamento.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Usar Arma: Arsenal; Criar Arma ou Fuuinjutsu 2"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-mestre-de-manobras",
    "key": "res-hijutsus2-mestre-de-manobras",
    "name": "Mestre De Manobras",
    "kind": "hijutsu",
    "origin": "buki-senmon",
    "accessOrigins": [
      "buki-senmon"
    ],
    "book": "hijutsus2",
    "page": 23,
    "pdfPage": 24,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Guerreiro; Acuidade Perfeita.",
    "levels": [
      {
        "level": 1,
        "requirements": "Guerreiro; Acuidade Perfeita.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.guerreiro",
              "label": "Aptidão: guerreiro"
            },
            {
              "fact": "aptitude.res-hijutsus2-acuidade-perfeita",
              "label": "Aptidão: Acuidade Perfeita"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite requisitos de manobra por Destreza e concede manobras escolhidas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Guerreiro; Acuidade Perfeita."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-arte-de-combate",
    "key": "res-hijutsus2-arte-de-combate",
    "name": "Arte De Combate",
    "kind": "hijutsu",
    "origin": "chouju-giga",
    "accessOrigins": [
      "chouju-giga"
    ],
    "book": "hijutsus2",
    "page": 24,
    "pdfPage": 25,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Arte 2",
    "levels": [
      {
        "level": 1,
        "requirements": "Arte 2",
        "checks": {
          "all": [
            {
              "fact": "skill.arte",
              "min": 2,
              "label": "Arte"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Dá acesso a Sumi Ninpou e concede benefícios de Perito e Perícia Inata em Arte.",
    "grantPlans": [
      {
        "benefitKey": "perito",
        "selection": "arte",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      },
      {
        "benefitKey": "pericia-inata",
        "selection": "arte",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Arte 2"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-resistencia-insaciavel",
    "key": "res-hijutsus2-resistencia-insaciavel",
    "name": "Resistência Insaciável",
    "kind": "hijutsu",
    "origin": "daikiga",
    "accessOrigins": [
      "daikiga"
    ],
    "book": "hijutsus2",
    "page": 30,
    "pdfPage": 31,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Concede dureza corporal que melhora conforme Vigor.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-ingestao-de-chakra",
    "key": "res-hijutsus2-ingestao-de-chakra",
    "name": "Ingestão De Chakra",
    "kind": "hijutsu",
    "origin": "daikiga",
    "accessOrigins": [
      "daikiga"
    ],
    "book": "hijutsus2",
    "page": 30,
    "pdfPage": 31,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 1.",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 1.",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 1,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Permite absorver chakra de uma vítima indefesa.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 1."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-rakanken",
    "key": "res-hijutsus2-rakanken",
    "name": "Rakanken (Punho Arhat)",
    "kind": "hijutsu",
    "origin": "daikiga",
    "accessOrigins": [
      "daikiga"
    ],
    "book": "hijutsus2",
    "page": 31,
    "pdfPage": 32,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Força 4; Ingestão de Chakra; Lutador",
    "levels": [
      {
        "level": 1,
        "requirements": "Força 4; Ingestão de Chakra; Lutador",
        "checks": {
          "all": [
            {
              "fact": "attribute.for",
              "min": 4,
              "label": "Força"
            },
            {
              "fact": "aptitude.res-hijutsus2-ingestao-de-chakra",
              "label": "Aptidão: Ingestão De Chakra"
            },
            {
              "fact": "aptitude.lutador",
              "label": "Aptidão: lutador"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica ataques físicos com consumo e benefícios próprios.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Força 4; Ingestão de Chakra; Lutador"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-terra-insaciavel",
    "key": "res-hijutsus2-terra-insaciavel",
    "name": "Terra Insaciável",
    "kind": "hijutsu",
    "origin": "daikiga",
    "accessOrigins": [
      "daikiga"
    ],
    "book": "hijutsus2",
    "page": 31,
    "pdfPage": 32,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ingestão de Chakra; Doton Nv 6; Barreira Nv 3 (Doton).",
    "levels": [
      {
        "level": 1,
        "requirements": "Ingestão de Chakra; Doton Nv 6; Barreira Nv 3 (Doton).",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-ingestao-de-chakra",
              "label": "Aptidão: Ingestão De Chakra"
            },
            {
              "fact": "power.doton",
              "min": 6,
              "label": "Poder doton"
            },
            {
              "review": "Conferir: Barreira Nv 3 (Doton)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede Barreira Doton evoluída e permite drenagem por contato com a barreira.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ingestão de Chakra; Doton Nv 6; Barreira Nv 3 (Doton)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-seis-bracos",
    "key": "res-hijutsus2-seis-bracos",
    "name": "Seis Braços",
    "kind": "hijutsu",
    "origin": "gorudogumo",
    "accessOrigins": [
      "gorudogumo"
    ],
    "book": "hijutsus2",
    "page": 33,
    "pdfPage": 34,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Destreza 4",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 4",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 4,
              "label": "Destreza"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Adiciona braços e modifica possibilidades de empunhadura, selos e manobras.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 4"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-ouro-pegajoso",
    "key": "res-hijutsus2-ouro-pegajoso",
    "name": "Ouro Pegajoso",
    "kind": "hijutsu",
    "origin": "gorudogumo",
    "accessOrigins": [
      "gorudogumo"
    ],
    "book": "hijutsus2",
    "page": 34,
    "pdfPage": 35,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 8; Kumo Ninpou 4",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 8; Kumo Ninpou 4",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 8,
              "label": "Espírito"
            },
            {
              "fact": "power.kumo-ninpou",
              "min": 4,
              "label": "Kumo Ninpou"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Endurece teia e concede criação de armas com evoluções relacionadas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 8; Kumo Ninpou 4"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-olho-de-aranha",
    "key": "res-hijutsus2-olho-de-aranha",
    "name": "Olho De Aranha",
    "kind": "hijutsu",
    "origin": "gorudogumo",
    "accessOrigins": [
      "gorudogumo"
    ],
    "book": "hijutsus2",
    "page": 34,
    "pdfPage": 35,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Percepção 12; Espírito 8.",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 12; Espírito 8.",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 12,
              "label": "Percepção"
            },
            {
              "fact": "attribute.esp",
              "min": 8,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Ativa percepção ampliada pelo olho adicional.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 12; Espírito 8."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-posessao-da-serpente-branca",
    "key": "res-hijutsus2-posessao-da-serpente-branca",
    "name": "Posessão Da Serpente Branca",
    "kind": "hijutsu",
    "origin": "hebinomichi",
    "accessOrigins": [
      "hebinomichi"
    ],
    "book": "hijutsus2",
    "page": 41,
    "pdfPage": 42,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 2; Espírito 2",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 2; Espírito 2",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 2,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "attribute.esp",
              "min": 2,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Transforma capacidades corporais e de troca de corpo por Hebinomichi.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 2; Espírito 2",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-yamata-no-jutsu",
    "key": "res-hijutsus2-yamata-no-jutsu",
    "name": "Yamata No Jutsu",
    "kind": "hijutsu",
    "origin": "hebinomichi",
    "accessOrigins": [
      "hebinomichi"
    ],
    "book": "hijutsus2",
    "page": 41,
    "pdfPage": 42,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 11; Possessão da Serpente Branca; Hebi Ninpou 5.",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 11; Possessão da Serpente Branca; Hebi Ninpou 5.",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 11,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "power.hebi-ninpou",
              "min": 5,
              "label": "Poder hebi-ninpou"
            },
            {
              "review": "Conferir: Possessão da Serpente Branca"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite transformação em serpente enorme com restrições de armas e técnicas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 11; Possessão da Serpente Branca; Hebi Ninpou 5.",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-usar-armas-de-jashin",
    "key": "res-hijutsus2-usar-armas-de-jashin",
    "name": "Usar Armas De Jashin",
    "kind": "hijutsu",
    "origin": "jashin-juusha",
    "accessOrigins": [
      "jashin-juusha"
    ],
    "book": "hijutsus2",
    "page": 43,
    "pdfPage": 44,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 4, Força 4.",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 4, Força 4.",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 4,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "attribute.for",
              "min": 4,
              "label": "Força"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proficiência e técnicas com as armas específicas do culto.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 4, Força 4."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-ritual-de-conexao",
    "key": "res-hijutsus2-ritual-de-conexao",
    "name": "Ritual De Conexão",
    "kind": "hijutsu",
    "origin": "jashin-juusha",
    "accessOrigins": [
      "jashin-juusha"
    ],
    "book": "hijutsus2",
    "page": 44,
    "pdfPage": 45,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 8.",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 8.",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 8,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Vincula usuário e vítima por ritual de sangue.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 8."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-imortalidade",
    "key": "res-hijutsus2-imortalidade",
    "name": "Imortalidade",
    "kind": "hijutsu",
    "origin": "jashin-juusha",
    "accessOrigins": [
      "jashin-juusha"
    ],
    "book": "hijutsus2",
    "page": 44,
    "pdfPage": 45,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Regeneração, Duro de Matar, Vigor 10",
    "levels": [
      {
        "level": 1,
        "requirements": "Regeneração, Duro de Matar, Vigor 10",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-basico-regeneracao",
              "label": "Aptidão: Regeneração"
            },
            {
              "fact": "aptitude.duro-de-matar",
              "label": "Aptidão: duro-de-matar"
            },
            {
              "fact": "attribute.vig",
              "min": 10,
              "label": "Vigor"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Mantém capacidades de sobrevivência próprias do pacto de Jashin.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Regeneração, Duro de Matar, Vigor 10"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-combatente-sadico",
    "key": "res-hijutsus2-combatente-sadico",
    "name": "Combatente Sádico",
    "kind": "hijutsu",
    "origin": "jashin-juusha",
    "accessOrigins": [
      "jashin-juusha"
    ],
    "book": "hijutsus2",
    "page": 45,
    "pdfPage": 46,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Usar Armas de Jashin, Ocultismo 12.",
    "levels": [
      {
        "level": 1,
        "requirements": "Usar Armas de Jashin, Ocultismo 12.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-usar-armas-de-jashin",
              "label": "Aptidão: Usar Armas De Jashin"
            },
            {
              "fact": "skill.ocultismo",
              "min": 12,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica combate e uso das armas do culto.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Usar Armas de Jashin, Ocultismo 12."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-jashinista-experiente",
    "key": "res-hijutsus2-jashinista-experiente",
    "name": "Jashinista Experiente",
    "kind": "hijutsu",
    "origin": "jashin-juusha",
    "accessOrigins": [
      "jashin-juusha"
    ],
    "book": "hijutsus2",
    "page": 45,
    "pdfPage": 46,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 16; Ritual de Conexão; Imortalidade",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 16; Ritual de Conexão; Imortalidade",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 16,
              "label": "Ocultismo"
            },
            {
              "fact": "aptitude.res-hijutsus2-ritual-de-conexao",
              "label": "Ritual de Conexão"
            },
            {
              "fact": "aptitude.res-hijutsus2-imortalidade",
              "label": "Imortalidade"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia condições e resultados do ritual de conexão.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 16; Ritual de Conexão; Imortalidade"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-sensibilidade-auditiva",
    "key": "res-hijutsus2-sensibilidade-auditiva",
    "name": "Sensibilidade Auditiva",
    "kind": "hijutsu",
    "origin": "jingokuon",
    "accessOrigins": [
      "jingokuon"
    ],
    "book": "hijutsus2",
    "page": 48,
    "pdfPage": 49,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Percepção 4",
    "levels": [
      {
        "level": 1,
        "requirements": "Percepção 4",
        "checks": {
          "all": [
            {
              "fact": "attribute.per",
              "min": 4,
              "label": "Percepção"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite percepção sonora especializada.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Percepção 4"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-tubos-de-ar",
    "key": "res-hijutsus2-tubos-de-ar",
    "name": "Tubos De Ar",
    "kind": "hijutsu",
    "origin": "jingokuon",
    "accessOrigins": [
      "jingokuon"
    ],
    "book": "hijutsus2",
    "page": 49,
    "pdfPage": 50,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Destreza 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 6",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 6,
              "label": "Destreza"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite uso de ataques e controle de ar por modificações corporais.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Incompatível com Kyoumei Supika (Alto-Falante Ressoante De Eco).",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "incompatibleKeys": [
      "res-hijutsus2-kyoumei-supika"
    ],
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kyoumei-supika",
    "key": "res-hijutsus2-kyoumei-supika",
    "name": "Kyoumei Supika (Alto-Falante Ressoante De Eco)",
    "kind": "hijutsu",
    "origin": "jingokuon",
    "accessOrigins": [
      "jingokuon"
    ],
    "book": "hijutsus2",
    "page": 49,
    "pdfPage": 50,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Acuidade e Destreza 6; ou Força 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Acuidade e Destreza 6; ou Força 6",
        "checks": {
          "all": [
            {
              "review": "Conferir: Acuidade e Destreza 6; ou Força 6"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite emitir som ressonante por instrumentos corporais.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Incompatível com Tubos De Ar.",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Acuidade e Destreza 6; ou Força 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "incompatibleKeys": [
      "res-hijutsus2-tubos-de-ar"
    ],
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-reverberacao",
    "key": "res-hijutsus2-reverberacao",
    "name": "Reverberação",
    "kind": "hijutsu",
    "origin": "jingokuon",
    "accessOrigins": [
      "jingokuon"
    ],
    "book": "hijutsus2",
    "page": 50,
    "pdfPage": 51,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ototon 5.",
    "levels": [
      {
        "level": 1,
        "requirements": "Ototon 5.",
        "checks": {
          "all": [
            {
              "fact": "power.ototon",
              "min": 5,
              "label": "Poder ototon"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia aplicações de Ototon.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ototon 5."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-corpo-de-fios",
    "key": "res-hijutsus2-corpo-de-fios",
    "name": "Corpo De Fios",
    "kind": "hijutsu",
    "origin": "jiongu",
    "accessOrigins": [
      "jiongu"
    ],
    "book": "hijutsus2",
    "page": 57,
    "pdfPage": 58,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ocultismo 2",
    "levels": [
      {
        "level": 1,
        "requirements": "Ocultismo 2",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 2,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Ocultismo 10",
        "checks": {
          "all": [
            {
              "fact": "skill.ocultismo",
              "min": 10,
              "label": "skill.ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "training.ocultismo"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite acesso a Jiongu e mudanças corporais baseadas em fios.",
    "grantPlans": [],
    "resources": [
      {
        "key": "jiongu.reserve",
        "label": "Corações e chakra de Jiongu",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ocultismo 2"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-chakra-expandido-jiongu",
    "key": "res-hijutsus2-chakra-expandido-jiongu",
    "name": "Chakra Expandido Jiongu",
    "kind": "hijutsu",
    "origin": "jiongu",
    "accessOrigins": [
      "jiongu"
    ],
    "book": "hijutsus2",
    "page": 58,
    "pdfPage": 59,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Jiongu 1; Ocultismo 2",
    "levels": [
      {
        "level": 1,
        "requirements": "Jiongu 1; Ocultismo 2",
        "checks": {
          "all": [
            {
              "fact": "power.jiongu",
              "min": 1,
              "label": "Poder jiongu"
            },
            {
              "fact": "skill.ocultismo",
              "min": 2,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia reserva e capacidades relacionadas ao Jiongu.",
    "grantPlans": [],
    "resources": [
      {
        "key": "jiongu.reserve",
        "label": "Corações e chakra de Jiongu",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Jiongu 1; Ocultismo 2"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-peso-do-ouro",
    "key": "res-hijutsus2-peso-do-ouro",
    "name": "Peso Do Ouro",
    "kind": "hijutsu",
    "origin": "jiton-ii",
    "accessOrigins": [
      "jiton-ii"
    ],
    "book": "hijutsus2",
    "page": 63,
    "pdfPage": 64,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Sakin 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Sakin 5",
        "checks": {
          "all": [
            {
              "fact": "power.sakin",
              "min": 5,
              "label": "Poder sakin"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Aplica peso e efeitos adicionais de Sakin, com progressão própria.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Sakin 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-marca-de-ferro",
    "key": "res-hijutsus2-marca-de-ferro",
    "name": "Marca De Ferro",
    "kind": "hijutsu",
    "origin": "jiton-ii",
    "accessOrigins": [
      "jiton-ii"
    ],
    "book": "hijutsus2",
    "page": 64,
    "pdfPage": 65,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Satetsu 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Satetsu 5",
        "checks": {
          "all": [
            {
              "fact": "power.satetsu",
              "min": 5,
              "label": "Poder satetsu"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Aplica capacidades adicionais de Satetsu.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Satetsu 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kakuran-taijutsu",
    "key": "res-hijutsus2-kakuran-taijutsu",
    "name": "Kakuran Taijutsu (Taijutsu Da Agitação)",
    "kind": "especial",
    "origin": "kakuran-tensai",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus2",
    "page": 70,
    "pdfPage": 71,
    "edition": "2026",
    "category": "Especial",
    "requirements": "Força ou Destreza 12; Acrobacia 12; Ponto Cego",
    "levels": [
      {
        "level": 1,
        "requirements": "Força ou Destreza 12; Acrobacia 12; Ponto Cego",
        "checks": {
          "all": [
            {
              "any": [
                {
                  "fact": "attribute.for",
                  "min": 12,
                  "label": "attribute.for"
                },
                {
                  "fact": "attribute.des",
                  "min": 12,
                  "label": "attribute.des"
                }
              ]
            },
            {
              "fact": "skill.acrobacia",
              "min": 12,
              "label": "skill.acrobacia"
            },
            {
              "fact": "aptitude.ponto-cego",
              "label": "Aptidão: ponto-cego"
            }
          ]
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Acrobacia 14",
        "checks": {
          "fact": "skill.acrobacia",
          "min": 14,
          "label": "skill.acrobacia"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia fintas e contrapõe visão acelerada; evolução libera Akurobatto.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Força ou Destreza 12; Acrobacia 12; Ponto Cego",
      "Acrobacia 14"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-elemento-natural-terra",
    "key": "res-hijutsus2-elemento-natural-terra",
    "name": "Elemento Natural: Terra",
    "kind": "hijutsu",
    "origin": "jinton",
    "accessOrigins": [
      "jinton"
    ],
    "book": "hijutsus2",
    "page": 71,
    "pdfPage": 72,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Doton 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Doton 1",
        "checks": {
          "all": [
            {
              "fact": "power.doton",
              "min": 1,
              "label": "Poder doton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia usos e dano de Doton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Doton 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-apagar-presenca",
    "key": "res-hijutsus2-apagar-presenca",
    "name": "Apagar Presença",
    "kind": "hijutsu",
    "origin": "jinton",
    "accessOrigins": [
      "jinton"
    ],
    "book": "hijutsus2",
    "page": 71,
    "pdfPage": 72,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Sensor; Rastrear 10;",
    "levels": [
      {
        "level": 1,
        "requirements": "Sensor; Rastrear 10;",
        "checks": {
          "all": [
            {
              "fact": "aptitude.sensor",
              "label": "Aptidão: sensor"
            },
            {
              "fact": "skill.rastrear",
              "min": 10,
              "label": "Rastrear"
            },
            {
              "review": "Conferir: "
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite suprimir a presença conforme capacidades de sensor.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Sensor; Rastrear 10;"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-fissao",
    "key": "res-hijutsus2-fissao",
    "name": "Fissão",
    "kind": "hijutsu",
    "origin": "jinton",
    "accessOrigins": [
      "jinton"
    ],
    "book": "hijutsus2",
    "page": 72,
    "pdfPage": 73,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 16; Vigor 8",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 16; Vigor 8",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 16,
              "label": "Espírito"
            },
            {
              "fact": "attribute.vig",
              "min": 8,
              "label": "Vigor"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite separar o corpo em uma duplicata, com divisão e regras próprias.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 16; Vigor 8"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-boca-de-moldagem",
    "key": "res-hijutsus2-boca-de-moldagem",
    "name": "Boca De Moldagem",
    "kind": "hijutsu",
    "origin": "kibaku-nendo",
    "accessOrigins": [
      "kibaku-nendo"
    ],
    "book": "hijutsus2",
    "page": 79,
    "pdfPage": 80,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Arte 12; Kibaku Nendo 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Arte 12; Kibaku Nendo 6",
        "checks": {
          "all": [
            {
              "fact": "skill.arte",
              "min": 12,
              "label": "Arte"
            },
            {
              "fact": "power.kibaku-nendo",
              "min": 6,
              "label": "Poder kibaku-nendo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite produzir bombas de argila adicionais a partir de matéria-prima.",
    "grantPlans": [],
    "resources": [
      {
        "key": "kibaku-nendo.reserve",
        "label": "Bombas de Argila",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Arte 12; Kibaku Nendo 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kugutsu",
    "key": "res-hijutsus2-kugutsu",
    "name": "Kugutsu (Marionetes)",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 86,
    "pdfPage": 87,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Mecanismos 4; Engenheiro (aptidão)",
    "levels": [
      {
        "level": 1,
        "requirements": "Mecanismos 4; Engenheiro (aptidão)",
        "checks": {
          "all": [
            {
              "fact": "skill.mecanismos",
              "min": 4,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            },
            {
              "fact": "aptitude.engenheiro",
              "label": "Aptidão: engenheiro"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Dá acesso à construção e ao controle de marionetes.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Mecanismos 4; Engenheiro (aptidão)"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-estrangular",
    "key": "res-hijutsus2-estrangular",
    "name": "Estrangular",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 96,
    "pdfPage": 97,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Mecanismos 12; Exclusivo para marionete",
    "levels": [
      {
        "level": 1,
        "requirements": "Mecanismos 12; Exclusivo para marionete",
        "checks": {
          "all": [
            {
              "fact": "skill.mecanismos",
              "min": 12,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            },
            {
              "review": "Conferir: Exclusivo para marionete"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite sufocamento após agarramento por marionete.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Mecanismos 12; Exclusivo para marionete"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-kurohigi",
    "key": "res-hijutsus2-kurohigi",
    "name": "Kurohigi (Estilo Secreto Negro)",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 96,
    "pdfPage": 97,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Kugutsu; Prestidigitação 6; Mecanismos 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Kugutsu; Prestidigitação 6; Mecanismos 6",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kugutsu",
              "label": "Aptidão: Kugutsu (Marionetes)"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 6,
              "label": "Prestidigitação"
            },
            {
              "fact": "skill.mecanismos",
              "min": 6,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 2,
        "requirements": "Kugutsu; Prestidigitação 10",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kugutsu",
              "label": "Aptidão: Kugutsu (Marionetes)"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 10,
              "label": "Prestidigitação"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 3,
        "requirements": "Kugutsu; Prestidigitação 12; Mecanismos 12",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kugutsu",
              "label": "Aptidão: Kugutsu (Marionetes)"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 12,
              "label": "Prestidigitação"
            },
            {
              "fact": "skill.mecanismos",
              "min": 12,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 4,
        "requirements": "Kugutsu; Prestidigitação 14",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kugutsu",
              "label": "Aptidão: Kugutsu (Marionetes)"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 14,
              "label": "Prestidigitação"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 4,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Evolui quantidade, tamanho e desempenho das marionetes controladas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kugutsu; Prestidigitação 6; Mecanismos 6",
      "Kugutsu; Prestidigitação 10",
      "Kugutsu; Prestidigitação 12; Mecanismos 12",
      "Kugutsu; Prestidigitação 14"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-shirohige",
    "key": "res-hijutsus2-shirohige",
    "name": "Shirohige",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 97,
    "pdfPage": 98,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Kurohigi; Mecanismos 16; Prestidigitação 16; Ocultismo 16.",
    "levels": [
      {
        "level": 1,
        "requirements": "Kurohigi; Mecanismos 16; Prestidigitação 16; Ocultismo 16.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kurohigi",
              "label": "Aptidão: Kurohigi (Estilo Secreto Negro)"
            },
            {
              "fact": "skill.mecanismos",
              "min": 16,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 16,
              "label": "Prestidigitação"
            },
            {
              "fact": "skill.ocultismo",
              "min": 16,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia controle de marionetes e ações ofensivas ou defensivas em grupo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kurohigi; Mecanismos 16; Prestidigitação 16; Ocultismo 16."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-akahige",
    "key": "res-hijutsus2-akahige",
    "name": "Akahige",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 97,
    "pdfPage": 98,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Shirohigi; Mecanismos 18; Prestidigitação 18; Ocultismo 18.",
    "levels": [
      {
        "level": 1,
        "requirements": "Shirohigi; Mecanismos 18; Prestidigitação 18; Ocultismo 18.",
        "checks": {
          "all": [
            {
              "fact": "skill.mecanismos",
              "min": 18,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            },
            {
              "fact": "skill.prestidigitacao",
              "min": 18,
              "label": "Prestidigitação"
            },
            {
              "fact": "skill.ocultismo",
              "min": 18,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "review": "Conferir: Shirohigi"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite uso de um grande conjunto de marionetes por cena.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Shirohigi; Mecanismos 18; Prestidigitação 18; Ocultismo 18."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-hitokugutsu",
    "key": "res-hijutsus2-hitokugutsu",
    "name": "Hitokugutsu",
    "kind": "hijutsu",
    "origin": "kugutsu-no-jutsu",
    "accessOrigins": [
      "kugutsu-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 98,
    "pdfPage": 99,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Kugutsu; Ninja Médico; Mecanismos 16; Medicina 16; Ocultismo 16 (parte Parcial)",
    "levels": [
      {
        "level": 1,
        "requirements": "Kugutsu; Ninja Médico; Mecanismos 16; Medicina 16; Ocultismo 16 (parte Parcial)",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus2-kugutsu",
              "label": "Kugutsu"
            },
            {
              "fact": "aptitude.ninja-medico",
              "label": "Ninja Médico"
            },
            {
              "fact": "skill.mecanismos",
              "min": 16,
              "label": "Mecanismos"
            },
            {
              "fact": "skill.medicina",
              "min": 16,
              "label": "Medicina"
            },
            {
              "fact": "skill.ocultismo",
              "min": 16,
              "label": "Ocultismo"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir restrições e escolhas na fonte."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite marionetes humanas parciais e completas; evolução completa é gratuita.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Parte Completa evolui gratuitamente; requer conferência e não é uma segunda compra paga.",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kugutsu; Ninja Médico; Mecanismos 16; Medicina 16; Ocultismo 16 (parte Parcial)"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-relampago-negro",
    "key": "res-hijutsus2-relampago-negro",
    "name": "Relâmpago Negro",
    "kind": "especial",
    "origin": "kuroi-kaminari",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus2",
    "page": 104,
    "pdfPage": 105,
    "edition": "2026",
    "category": "Especial",
    "requirements": "Raiton 5; Domínio do Raio",
    "levels": [
      {
        "level": 1,
        "requirements": "Raiton 5; Domínio do Raio",
        "checks": {
          "all": [
            {
              "fact": "power.raiton",
              "min": 5,
              "label": "Poder raiton"
            },
            {
              "fact": "aptitude.dominio-do-raio",
              "label": "Aptidão: dominio-do-raio"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia o crítico de efeitos Raiton elegíveis mediante custo adicional.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Raiton 5; Domínio do Raio"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-flautista",
    "key": "res-hijutsus2-flautista",
    "name": "Flautista",
    "kind": "hijutsu",
    "origin": "mateki",
    "accessOrigins": [
      "mateki"
    ],
    "book": "hijutsus2",
    "page": 105,
    "pdfPage": 106,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Inteligência 4; Fascinar",
    "levels": [
      {
        "level": 1,
        "requirements": "Inteligência 4; Fascinar",
        "checks": {
          "all": [
            {
              "fact": "attribute.int",
              "min": 4,
              "label": "Inteligência"
            },
            {
              "fact": "aptitude.fascinar",
              "label": "Aptidão: fascinar"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite uso da Flauta Demoníaca e suas características.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Inteligência 4; Fascinar"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-ilusoes-avancadas",
    "key": "res-hijutsus2-ilusoes-avancadas",
    "name": "Ilusões Avançadas",
    "kind": "hijutsu",
    "origin": "mateki",
    "accessOrigins": [
      "mateki"
    ],
    "book": "hijutsus2",
    "page": 105,
    "pdfPage": 106,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Arte 9, Flautista, Ilusão Profunda",
    "levels": [
      {
        "level": 1,
        "requirements": "Arte 9, Flautista, Ilusão Profunda",
        "checks": {
          "all": [
            {
              "fact": "skill.arte",
              "min": 9,
              "label": "Arte"
            },
            {
              "fact": "aptitude.res-hijutsus2-flautista",
              "label": "Aptidão: Flautista"
            },
            {
              "fact": "aptitude.ilusao-profunda",
              "label": "Aptidão: ilusao-profunda"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia ilusões executadas com Mateki e seus parâmetros.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Arte 9, Flautista, Ilusão Profunda"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-yoton-corrosivo",
    "key": "res-hijutsus2-yoton-corrosivo",
    "name": "Yoton Corrosivo",
    "kind": "hijutsu",
    "origin": "mei-kekkei-genkai",
    "accessOrigins": [
      "mei-kekkei-genkai"
    ],
    "book": "hijutsus2",
    "page": 109,
    "pdfPage": 110,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Youton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Youton 5",
        "checks": {
          "all": [
            {
              "fact": "power.youton",
              "min": 5,
              "label": "Poder youton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Acrescenta dano fixo a efeitos de Youton em contato.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Youton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-futton-sufocante",
    "key": "res-hijutsus2-futton-sufocante",
    "name": "Futton Sufocante",
    "kind": "hijutsu",
    "origin": "mei-kekkei-genkai",
    "accessOrigins": [
      "mei-kekkei-genkai"
    ],
    "book": "hijutsus2",
    "page": 109,
    "pdfPage": 110,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Futton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Futton 5",
        "checks": {
          "all": [
            {
              "fact": "power.futton",
              "min": 5,
              "label": "Poder futton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Adapta os benefícios de Domínio do Fogo aos efeitos Futton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Futton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-dupla-linhagem",
    "key": "res-hijutsus2-dupla-linhagem",
    "name": "Dupla Linhagem",
    "kind": "hijutsu",
    "origin": "mei-kekkei-genkai",
    "accessOrigins": [
      "mei-kekkei-genkai"
    ],
    "book": "hijutsus2",
    "page": 109,
    "pdfPage": 110,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 10; Futton ou Youton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 10; Futton ou Youton 5",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 10,
              "label": "Espírito"
            },
            {
              "review": "Conferir: Futton ou Youton 5"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Libera o outro poder restrito e o elemento básico faltante da linhagem Mei.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 10; Futton ou Youton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-extracao-energetica",
    "key": "res-hijutsus2-extracao-energetica",
    "name": "Extração Energética",
    "kind": "especial",
    "origin": "nan-no-kaizou",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus2",
    "page": 114,
    "pdfPage": 115,
    "edition": "2026",
    "category": "Especial",
    "requirements": "Espírito 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 6",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 6,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite absorção e armazenamento temporário de chakra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Incompatível com Manipulação Física.",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 6",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "incompatibleKeys": [
      "res-hijutsus2-manipulacao-fisica"
    ],
    "noClan": true,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-manipulacao-fisica",
    "key": "res-hijutsus2-manipulacao-fisica",
    "name": "Manipulação Física",
    "kind": "especial",
    "origin": "nan-no-kaizou",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus2",
    "page": 114,
    "pdfPage": 115,
    "edition": "2026",
    "category": "Especial",
    "requirements": "Lutador; Vigor 4",
    "levels": [
      {
        "level": 1,
        "requirements": "Lutador; Vigor 4",
        "checks": {
          "all": [
            {
              "fact": "aptitude.lutador",
              "label": "Aptidão: lutador"
            },
            {
              "fact": "attribute.vig",
              "min": 4,
              "label": "Vigor"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica articulações e concede benefício de Corpo Esguio.",
    "grantPlans": [
      {
        "benefitKey": "corpo-esguio",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Incompatível com Extração Energética.",
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Lutador; Vigor 4",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "incompatibleKeys": [
      "res-hijutsus2-extracao-energetica"
    ],
    "noClan": true,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-efeito-estroboscopio",
    "key": "res-hijutsus2-efeito-estroboscopio",
    "name": "Efeito Estroboscópio",
    "kind": "hijutsu",
    "origin": "ranton",
    "accessOrigins": [
      "ranton"
    ],
    "book": "hijutsus2",
    "page": 118,
    "pdfPage": 119,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Ranton 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Ranton 6",
        "checks": {
          "fact": "power.ranton",
          "min": 6,
          "label": "Poder ranton"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Ranton 10",
        "checks": {
          "fact": "power.ranton",
          "min": 10,
          "label": "Poder ranton"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Prejudica a visão de alvos atingidos por Ranton; possui evolução.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Ranton 6",
      "Ranton 10"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-rinbo-hengoku",
    "key": "res-hijutsus2-rinbo-hengoku",
    "name": "Rinbo: Hengoku",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus2",
    "page": 119,
    "pdfPage": 120,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Rinnegan (Esta Aptidão faz parte do Hijutsu Rinnegan); Gedou (Caminho Externo); Clone Verdadeiro; Espírito 20; Ocultismo 20.",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan (Esta Aptidão faz parte do Hijutsu Rinnegan); Gedou (Caminho Externo); Clone Verdadeiro; Espírito 20; Ocultismo 20.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.clone-verdadeiro",
              "label": "Aptidão: clone-verdadeiro"
            },
            {
              "fact": "attribute.esp",
              "min": 20,
              "label": "Espírito"
            },
            {
              "fact": "skill.ocultismo",
              "min": 20,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "review": "Conferir: Rinnegan (Esta Aptidão faz parte do Hijutsu Rinnegan); Gedou (Caminho Externo)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      },
      {
        "level": 2,
        "requirements": "Evolução indicada na fonte; conferir condições específicas.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Evolução indicada na fonte; conferir condições específicas"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Conferir escolhas, limitações e/ou concessões na fonte."
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Projeta sombras no Limbo; exige caminho Gedou e impõe incompatibilidades.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan (Esta Aptidão faz parte do Hijutsu Rinnegan); Gedou (Caminho Externo); Clone Verdadeiro; Espírito 20; Ocultismo 20.",
      "Evolução indicada na fonte; conferir condições específicas."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-mumificar",
    "key": "res-hijutsus2-mumificar",
    "name": "Mumificar",
    "kind": "hijutsu",
    "origin": "shakuton",
    "accessOrigins": [
      "shakuton"
    ],
    "book": "hijutsus2",
    "page": 120,
    "pdfPage": 121,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Shakuton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Shakuton 5",
        "checks": {
          "all": [
            {
              "fact": "power.shakuton",
              "min": 5,
              "label": "Poder shakuton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Impõe consequências corporais por ataques Shakuton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Shakuton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-barreira-regenerativa",
    "key": "res-hijutsus2-barreira-regenerativa",
    "name": "Barreira Regenerativa",
    "kind": "hijutsu",
    "origin": "shouton",
    "accessOrigins": [
      "shouton"
    ],
    "book": "hijutsus2",
    "page": 123,
    "pdfPage": 124,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Shouton 5.",
    "levels": [
      {
        "level": 1,
        "requirements": "Shouton 5.",
        "checks": {
          "all": [
            {
              "fact": "power.shouton",
              "min": 5,
              "label": "Poder shouton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite renovar dureza de Barreira Shouton sob condições próprias.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Shouton 5."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-cristalizacao",
    "key": "res-hijutsus2-cristalizacao",
    "name": "Cristalização",
    "kind": "hijutsu",
    "origin": "shouton",
    "accessOrigins": [
      "shouton"
    ],
    "book": "hijutsus2",
    "page": 123,
    "pdfPage": 124,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Shouton 7; Congelamento (aptidão).",
    "levels": [
      {
        "level": 1,
        "requirements": "Shouton 7; Congelamento (aptidão).",
        "checks": {
          "all": [
            {
              "fact": "power.shouton",
              "min": 7,
              "label": "Poder shouton"
            },
            {
              "fact": "aptitude.res-hijutsus1-congelamento",
              "label": "Aptidão: Congelamento"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia efeitos prévios de Congelamento por Shouton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Shouton 7; Congelamento (aptidão)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-cristal-guiado",
    "key": "res-hijutsus2-cristal-guiado",
    "name": "Cristal Guiado",
    "kind": "hijutsu",
    "origin": "shouton",
    "accessOrigins": [
      "shouton"
    ],
    "book": "hijutsus2",
    "page": 124,
    "pdfPage": 125,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Shouton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Shouton 5",
        "checks": {
          "all": [
            {
              "fact": "power.shouton",
              "min": 5,
              "label": "Poder shouton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite repetir ataques Shouton por concentração e custo recorrente.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Shouton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-souma-no-kou",
    "key": "res-hijutsus2-souma-no-kou",
    "name": "Souma No Kou (Ataque Dos Demônios Gêmeos)",
    "kind": "hijutsu",
    "origin": "souma-no-jutsu",
    "accessOrigins": [
      "souma-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 127,
    "pdfPage": 128,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Vigor 2; somente na criação",
    "levels": [
      {
        "level": 1,
        "requirements": "Vigor 2; somente na criação",
        "checks": {
          "fact": "attribute.vig",
          "min": 2,
          "label": "attribute.vig"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Vigor 8",
        "checks": {
          "fact": "attribute.vig",
          "min": 8,
          "label": "attribute.vig"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 3,
        "requirements": "Vigor 12",
        "checks": {
          "fact": "attribute.vig",
          "min": 12,
          "label": "attribute.vig"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 3,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Vincula gêmeos Hospedeiro e Parasita; possui três níveis e aquisição na criação.",
    "grantPlans": [],
    "resources": [
      {
        "key": "souma-no-jutsu.reserve",
        "label": "Vínculo Hospedeiro/Parasita",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Vigor 2; somente na criação",
      "Vigor 8",
      "Vigor 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "creationOnly": true,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-regeneracao-gemea",
    "key": "res-hijutsus2-regeneracao-gemea",
    "name": "Regeneração Gêmea",
    "kind": "hijutsu",
    "origin": "souma-no-jutsu",
    "accessOrigins": [
      "souma-no-jutsu"
    ],
    "book": "hijutsus2",
    "page": 130,
    "pdfPage": 131,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Vigor 4; Souma no Kou Nv 1.",
    "levels": [
      {
        "level": 1,
        "requirements": "Vigor 4; Souma no Kou Nv 1.",
        "checks": {
          "all": [
            {
              "fact": "attribute.vig",
              "min": 4,
              "label": "Vigor"
            },
            {
              "fact": "aptitudeLevel.res-hijutsus2-souma-no-kou",
              "min": 1,
              "label": "Souma no Kou"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Compartilha benefícios de regeneração durante a fusão dos gêmeos.",
    "grantPlans": [],
    "resources": [
      {
        "key": "souma-no-jutsu.reserve",
        "label": "Vínculo Hospedeiro/Parasita",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Vigor 4; Souma no Kou Nv 1."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-mestre-dos-leques",
    "key": "res-hijutsus2-mestre-dos-leques",
    "name": "Mestre Dos Leques",
    "kind": "hijutsu",
    "origin": "tessenjutsu",
    "accessOrigins": [
      "tessenjutsu"
    ],
    "book": "hijutsus2",
    "page": 131,
    "pdfPage": 132,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Destreza 6; Fuuton 3",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 6; Fuuton 3",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 6,
              "label": "Destreza"
            },
            {
              "fact": "power.fuuton",
              "min": 3,
              "label": "Poder fuuton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proficiência no leque, Especialista e Maestria para Fuuton.",
    "grantPlans": [
      {
        "benefitKey": "usar-arma",
        "selection": "fan",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      },
      {
        "benefitKey": "especialista",
        "selection": "long",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 6; Fuuton 3"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-brisa-de-navalha",
    "key": "res-hijutsus2-brisa-de-navalha",
    "name": "Brisa De Navalha",
    "kind": "hijutsu",
    "origin": "tessenjutsu",
    "accessOrigins": [
      "tessenjutsu"
    ],
    "book": "hijutsus2",
    "page": 131,
    "pdfPage": 132,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 10; Fuuton 5",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 10; Fuuton 5",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 10,
              "label": "Espírito"
            },
            {
              "fact": "power.fuuton",
              "min": 5,
              "label": "Poder fuuton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Libera um uso específico de Lâmina de Vento.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 10; Fuuton 5"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-capacidade-dos-ventos",
    "key": "res-hijutsus2-capacidade-dos-ventos",
    "name": "Capacidade Dos Ventos",
    "kind": "hijutsu",
    "origin": "tessenjutsu",
    "accessOrigins": [
      "tessenjutsu"
    ],
    "book": "hijutsus2",
    "page": 132,
    "pdfPage": 133,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito ou Inteligência 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito ou Inteligência 12",
        "checks": {
          "all": [
            {
              "review": "Conferir: Espírito ou Inteligência 12"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica uso de meta-aptidões Fuuton com Leque Gigante.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito ou Inteligência 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-anatomia-zetsu",
    "key": "res-hijutsus2-anatomia-zetsu",
    "name": "Anatomia Zetsu",
    "kind": "hijutsu",
    "origin": "zetsu-seitai",
    "accessOrigins": [
      "zetsu-seitai"
    ],
    "book": "hijutsus2",
    "page": 133,
    "pdfPage": 134,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Origem Zetsu Seitai",
    "levels": [
      {
        "level": 1,
        "requirements": "Origem Zetsu Seitai",
        "checks": {
          "all": []
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 2,
        "requirements": "Vigor 8",
        "checks": {
          "fact": "attribute.vig",
          "min": 8,
          "label": "attribute.vig"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      },
      {
        "level": 3,
        "requirements": "Vigor 12",
        "checks": {
          "fact": "attribute.vig",
          "min": 12,
          "label": "attribute.vig"
        },
        "review": false,
        "reviewReason": "",
        "cost": 2
      }
    ],
    "maxLevel": 3,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Modifica necessidades e anatomia; evoluções permitem usos especiais de chakra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Origem Zetsu Seitai",
      "Vigor 8",
      "Vigor 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-clone-zetsu",
    "key": "res-hijutsus2-clone-zetsu",
    "name": "Clone Zetsu",
    "kind": "hijutsu",
    "origin": "zetsu-seitai",
    "accessOrigins": [
      "zetsu-seitai"
    ],
    "book": "hijutsus2",
    "page": 134,
    "pdfPage": 135,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Clone (aptidão).",
    "levels": [
      {
        "level": 1,
        "requirements": "Clone (aptidão).",
        "checks": {
          "all": [
            {
              "fact": "aptitude.clone",
              "label": "Aptidão: clone"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite clones especiais com capacidades próprias.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Clone (aptidão)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus2-elementos-irrestritos",
    "key": "res-hijutsus2-elementos-irrestritos",
    "name": "Elementos Irrestritos",
    "kind": "hijutsu",
    "origin": "zetsu-seitai",
    "accessOrigins": [
      "zetsu-seitai"
    ],
    "book": "hijutsus2",
    "page": 134,
    "pdfPage": 135,
    "edition": "2026",
    "category": "Restrita",
    "requirements": "Espírito 10; Mokuton 5.",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito 10; Mokuton 5.",
        "checks": {
          "all": [
            {
              "fact": "attribute.esp",
              "min": 10,
              "label": "Espírito"
            },
            {
              "fact": "power.mokuton",
              "min": 5,
              "label": "Poder mokuton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede acesso aos cinco elementos e usos de Canhão por Mokuton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito 10; Mokuton 5."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-demonio-do-vento",
    "key": "res-hijutsus1-demonio-do-vento",
    "name": "Demônio Do Vento",
    "kind": "especial",
    "origin": "fuuma",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus1",
    "page": 7,
    "pdfPage": 7,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Tensai (Hijutsu).",
    "levels": [
      {
        "level": 1,
        "requirements": "Tensai (Hijutsu).",
        "checks": {
          "all": [
            {
              "review": "Conferir: Tensai (Hijutsu)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede benefícios de armas Fuuma e aplicações associadas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Tensai (Hijutsu)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-predador-aquatico",
    "key": "res-hijutsus1-predador-aquatico",
    "name": "Predador Aquático",
    "kind": "cla",
    "origin": "hoshigaki",
    "accessOrigins": [
      "hoshigaki"
    ],
    "book": "hijutsus1",
    "page": 8,
    "pdfPage": 8,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Permite respiração e deslocamento aquáticos e proteção corporal.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-elemento-natural-suiton",
    "key": "res-hijutsus1-elemento-natural-suiton",
    "name": "Elemento Natural: Suiton",
    "kind": "cla",
    "origin": "hoshigaki",
    "accessOrigins": [
      "hoshigaki"
    ],
    "book": "hijutsus1",
    "page": 8,
    "pdfPage": 8,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Predador Aquático; Suiton 1.",
    "levels": [
      {
        "level": 1,
        "requirements": "Predador Aquático; Suiton 1.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-predador-aquatico",
              "label": "Aptidão: Predador Aquático"
            },
            {
              "fact": "power.suiton",
              "min": 1,
              "label": "Poder suiton"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica o dano elemental de Suiton.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Predador Aquático; Suiton 1."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-reserva-de-agua",
    "key": "res-hijutsus1-reserva-de-agua",
    "name": "Reserva De Água",
    "kind": "cla",
    "origin": "hoshigaki",
    "accessOrigins": [
      "hoshigaki"
    ],
    "book": "hijutsus1",
    "page": 9,
    "pdfPage": 9,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Suiton 5, Espírito 9, Domínio da Água, Elemento Natural.",
    "levels": [
      {
        "level": 1,
        "requirements": "Suiton 5, Espírito 9, Domínio da Água, Elemento Natural.",
        "checks": {
          "all": [
            {
              "fact": "power.suiton",
              "min": 5,
              "label": "Poder suiton"
            },
            {
              "fact": "attribute.esp",
              "min": 9,
              "label": "Espírito"
            },
            {
              "fact": "aptitude.dominio-da-agua",
              "label": "Aptidão: dominio-da-agua"
            },
            {
              "review": "Conferir: Elemento Natural"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia os pontos de água gerados por Domínio da Água.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Suiton 5, Espírito 9, Domínio da Água, Elemento Natural."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-suika",
    "key": "res-hijutsus1-suika",
    "name": "Suika",
    "kind": "cla",
    "origin": "hozuki",
    "accessOrigins": [
      "hozuki"
    ],
    "book": "hijutsus1",
    "page": 10,
    "pdfPage": 10,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Suiton 4; Espírito 9",
    "levels": [
      {
        "level": 1,
        "requirements": "Suiton 4; Espírito 9",
        "checks": {
          "all": [
            {
              "fact": "power.suiton",
              "min": 4,
              "label": "Poder suiton"
            },
            {
              "fact": "attribute.esp",
              "min": 9,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite transformação corporal aquosa com vulnerabilidades e evolução.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Suiton 4; Espírito 9"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-artesao-de-ossos",
    "key": "res-hijutsus1-artesao-de-ossos",
    "name": "Artesão De Ossos",
    "kind": "cla",
    "origin": "kaguya",
    "accessOrigins": [
      "kaguya"
    ],
    "book": "hijutsus1",
    "page": 14,
    "pdfPage": 14,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite criar armamentos de ossos e regenerar a estrutura removida.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-armadura-ossea",
    "key": "res-hijutsus1-armadura-ossea",
    "name": "Armadura Óssea",
    "kind": "cla",
    "origin": "kaguya",
    "accessOrigins": [
      "kaguya"
    ],
    "book": "hijutsus1",
    "page": 15,
    "pdfPage": 15,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proteção interna, Duro de Matar e resistência a fraturas.",
    "grantPlans": [
      {
        "benefitKey": "duro-de-matar",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-lamina-da-lua",
    "key": "res-hijutsus1-lamina-da-lua",
    "name": "Lâmina Da Lua",
    "kind": "especial",
    "origin": "yotsuki",
    "accessOrigins": [
      "tensai"
    ],
    "book": "hijutsus1",
    "page": 18,
    "pdfPage": 18,
    "edition": "4.1.b",
    "category": "Especial",
    "requirements": "Tensai (Hijutsu).",
    "levels": [
      {
        "level": 1,
        "requirements": "Tensai (Hijutsu).",
        "checks": {
          "all": [
            {
              "review": "Conferir: Tensai (Hijutsu)"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede Acuidade e Domínio do Raio, com técnicas associadas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Tensai (Hijutsu)."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "slotGroup": "tensai-special",
    "slotLimit": 2,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-selos-especiais",
    "key": "res-hijutsus1-selos-especiais",
    "name": "Selos Especiais",
    "kind": "cla",
    "origin": "yuki",
    "accessOrigins": [
      "yuki"
    ],
    "book": "hijutsus1",
    "page": 18,
    "pdfPage": 18,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 8",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 8",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 8,
              "label": "Destreza"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite realizar selos com uma mão e remove penalidade específica.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 8"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-congelamento",
    "key": "res-hijutsus1-congelamento",
    "name": "Congelamento",
    "kind": "cla",
    "origin": "yuki",
    "accessOrigins": [
      "yuki"
    ],
    "book": "hijutsus1",
    "page": 19,
    "pdfPage": 19,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Hyouton 6.",
    "levels": [
      {
        "level": 1,
        "requirements": "Hyouton 6.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Hyouton 6"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Aplica impedimento por ataques Hyouton elegíveis.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Hyouton 6."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-juuinka-ichi",
    "key": "res-hijutsus1-juuinka-ichi",
    "name": "Juuinka - Ichi",
    "kind": "hijutsu",
    "origin": "juuinka",
    "accessOrigins": [
      "juuinka"
    ],
    "book": "hijutsus1",
    "page": 56,
    "pdfPage": 56,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Espírito ou Vigor 8; Ter sobrevivido ao Juuin Jutsu.",
    "levels": [
      {
        "level": 1,
        "requirements": "Espírito ou Vigor 8; Ter sobrevivido ao Juuin Jutsu.",
        "checks": {
          "all": [
            {
              "review": "Conferir: Espírito ou Vigor 8; Ter sobrevivido ao Juuin Jutsu"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite liberar o primeiro estágio do Selo Amaldiçoado.",
    "grantPlans": [],
    "resources": [
      {
        "key": "juuinka.reserve",
        "label": "Selo Amaldiçoado",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Espírito ou Vigor 8; Ter sobrevivido ao Juuin Jutsu."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-juuinka-ni",
    "key": "res-hijutsus1-juuinka-ni",
    "name": "Juuinka - Ni",
    "kind": "hijutsu",
    "origin": "juuinka",
    "accessOrigins": [
      "juuinka"
    ],
    "book": "hijutsus1",
    "page": 56,
    "pdfPage": 56,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Juuinka - Ichi; Espírito ou Vigor 10; Passar pelo Ritual da Névoa Negra.",
    "levels": [
      {
        "level": 1,
        "requirements": "Juuinka - Ichi; Espírito ou Vigor 10; Passar pelo Ritual da Névoa Negra.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-juuinka-ichi",
              "label": "Aptidão: Juuinka - Ichi"
            },
            {
              "review": "Conferir: Espírito ou Vigor 10; Passar pelo Ritual da Névoa Negra"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite o segundo estágio após ritual e liberação do primeiro.",
    "grantPlans": [],
    "resources": [
      {
        "key": "juuinka.reserve",
        "label": "Selo Amaldiçoado",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Juuinka - Ichi; Espírito ou Vigor 10; Passar pelo Ritual da Névoa Negra."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-shikigami-no-mai",
    "key": "res-hijutsus1-shikigami-no-mai",
    "name": "Shikigami No Mai (Dança Dos Espíritos De Papel)",
    "kind": "hijutsu",
    "origin": "kamijutsu",
    "accessOrigins": [
      "kamijutsu"
    ],
    "book": "hijutsus1",
    "page": 60,
    "pdfPage": 60,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Kami Ninpou 4; Arte ou Espírito 9.",
    "levels": [
      {
        "level": 1,
        "requirements": "Kami Ninpou 4; Arte ou Espírito 9.",
        "checks": {
          "all": [
            {
              "fact": "power.kami-ninpou",
              "min": 4,
              "label": "Poder kami-ninpou"
            },
            {
              "review": "Conferir: Arte ou Espírito 9"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      },
      {
        "level": 2,
        "requirements": "Kami Ninpou 6",
        "checks": {
          "all": [
            {
              "fact": "power.kami-ninpou",
              "min": 6,
              "label": "Poder kami-ninpou"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 2,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Transforma o corpo em papel e gerencia pontos Kami; possui evolução.",
    "grantPlans": [],
    "resources": [
      {
        "key": "kamijutsu.reserve",
        "label": "Pontos Kami",
        "requiredForPurchase": false
      }
    ],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kami Ninpou 4; Arte ou Espírito 9.",
      "Kami Ninpou 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-armadura-de-raios",
    "key": "res-hijutsus1-armadura-de-raios",
    "name": "Armadura De Raios",
    "kind": "hijutsu",
    "origin": "nintaijutsu",
    "accessOrigins": [
      "nintaijutsu"
    ],
    "book": "hijutsus1",
    "page": 64,
    "pdfPage": 64,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nintaijutsu 5, Espírito 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Nintaijutsu 5, Espírito 6",
        "checks": {
          "all": [
            {
              "fact": "power.nintaijutsu",
              "min": 5,
              "label": "Poder nintaijutsu"
            },
            {
              "fact": "attribute.esp",
              "min": 6,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 2,
        "requirements": "Nintaijutsu 6, Espírito 9",
        "checks": {
          "all": [
            {
              "fact": "power.nintaijutsu",
              "min": 6,
              "label": "Poder nintaijutsu"
            },
            {
              "fact": "attribute.esp",
              "min": 9,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      },
      {
        "level": 3,
        "requirements": "Nintaijutsu 8, Espírito 14",
        "checks": {
          "all": [
            {
              "fact": "power.nintaijutsu",
              "min": 8,
              "label": "Poder nintaijutsu"
            },
            {
              "fact": "attribute.esp",
              "min": 14,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 3,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Ativa proteção e velocidade elétricas em três níveis.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Nintaijutsu 5, Espírito 6",
      "Nintaijutsu 6, Espírito 9",
      "Nintaijutsu 8, Espírito 14"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-rinnegan",
    "key": "res-hijutsus1-rinnegan",
    "name": "Rinnegan",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 65,
    "pdfPage": 65,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede doujutsu permanente e acesso elemental próprio.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-shurado",
    "key": "res-hijutsus1-shurado",
    "name": "Shuradō (Caminho Asura)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 67,
    "pdfPage": 67,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 12; Mecanismos 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 12; Mecanismos 12",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 12,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "skill.mecanismos",
              "min": 12,
              "label": "Mecanismos"
            },
            {
              "fact": "training.mecanismos",
              "min": 1,
              "label": "Ponto investido em Mecanismos"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite modificações e armamentos mecânicos no corpo.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 12; Mecanismos 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-jigokudo",
    "key": "res-hijutsus1-jigokudo",
    "name": "Jigokudō (Caminho Naraka)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 67,
    "pdfPage": 67,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 12; Espírito 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 12; Espírito 12",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 12,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "attribute.esp",
              "min": 12,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite invocar e comandar o Rei do Inferno.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 12; Espírito 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-ningendo",
    "key": "res-hijutsus1-ningendo",
    "name": "Ningendō (Caminho Humano)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 68,
    "pdfPage": 68,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 14; Concentração 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 14; Concentração 12",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 14,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "skill.concentracao",
              "min": 12,
              "label": "Concentração"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite leitura mental e extração por contato.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 14; Concentração 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-gakido",
    "key": "res-hijutsus1-gakido",
    "name": "Gakidō (Caminho Preta)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 68,
    "pdfPage": 68,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 14; Espírito 14",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 14; Espírito 14",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 14,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "attribute.esp",
              "min": 14,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite absorção e neutralização de chakra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 14; Espírito 14"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-chikushodo",
    "key": "res-hijutsus1-chikushodo",
    "name": "Chikushōdō (Caminho Animal)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 69,
    "pdfPage": 69,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 16; Rinne Ninpou 7",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 16; Rinne Ninpou 7",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 16,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "review": "Conferir: Rinne Ninpou 7"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede Kuchiyose associado ao Rinne Ninpou e invocações específicas.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 16; Rinne Ninpou 7"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-tendo",
    "key": "res-hijutsus1-tendo",
    "name": "Tendō (Caminho Deva)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 71,
    "pdfPage": 71,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 16; Rinne Ninpou 8.",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 16; Rinne Ninpou 8.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 16,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "review": "Conferir: Rinne Ninpou 8"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite técnicas de atração e repulsão, com intervalos próprios.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 16; Rinne Ninpou 8."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-gedo",
    "key": "res-hijutsus1-gedo",
    "name": "Gedō (Caminho Externo)",
    "kind": "hijutsu",
    "origin": "rinnegan",
    "accessOrigins": [
      "rinnegan"
    ],
    "book": "hijutsus1",
    "page": 73,
    "pdfPage": 73,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rinnegan; Ocultismo 18; Espírito 18.",
    "levels": [
      {
        "level": 1,
        "requirements": "Rinnegan; Ocultismo 18; Espírito 18.",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-hijutsus1-rinnegan",
              "label": "Aptidão: Rinnegan"
            },
            {
              "fact": "skill.ocultismo",
              "min": 18,
              "label": "Ocultismo"
            },
            {
              "fact": "training.ocultismo",
              "min": 1,
              "label": "Ponto investido em Ocultismo"
            },
            {
              "fact": "attribute.esp",
              "min": 18,
              "label": "Espírito"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite receptores de chakra e aplicações especiais de vida e morte.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rinnegan; Ocultismo 18; Espírito 18."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-espadachim",
    "key": "res-hijutsus1-espadachim",
    "name": "Espadachim",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 76,
    "pdfPage": 76,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
    "levels": [
      {
        "level": 1,
        "requirements": "Nenhum requisito adicional expresso no bloco inicial.",
        "checks": {
          "all": []
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia manobras com espadas e concede Desarme Agressivo.",
    "grantPlans": [
      {
        "benefitKey": "desarme-agressivo",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-sabre-samurai",
    "key": "res-hijutsus1-sabre-samurai",
    "name": "Sabre Samurai",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 76,
    "pdfPage": 76,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Combate Corporal 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Combate Corporal 12",
        "checks": {
          "all": [
            {
              "fact": "combat.cc",
              "min": 12,
              "label": "Combate Corporal"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede proficiência em espadas e técnicas de lâmina de chakra.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Combate Corporal 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-iaido",
    "key": "res-hijutsus1-iaido",
    "name": "Iaido",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 77,
    "pdfPage": 77,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 8; Espadachim; Saque Rápido",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 8; Espadachim; Saque Rápido",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 8,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.res-hijutsus1-espadachim",
              "label": "Aptidão: Espadachim"
            },
            {
              "fact": "aptitude.saque-rapido",
              "label": "Aptidão: saque-rapido"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia o ataque ao sacar espada, com Acuidade e finta.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 8; Espadachim; Saque Rápido"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-yojinbo",
    "key": "res-hijutsus1-yojinbo",
    "name": "Yojinbo",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 77,
    "pdfPage": 77,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 10; Espadachim; Saque Rápido; Iaido; Ataque em Movimento.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 10; Espadachim; Saque Rápido; Iaido; Ataque em Movimento.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 10,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.res-hijutsus1-espadachim",
              "label": "Aptidão: Espadachim"
            },
            {
              "fact": "aptitude.saque-rapido",
              "label": "Aptidão: saque-rapido"
            },
            {
              "fact": "aptitude.res-hijutsus1-iaido",
              "label": "Aptidão: Iaido"
            },
            {
              "fact": "aptitude.ataque-em-movimento",
              "label": "Aptidão: ataque-em-movimento"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica uma investida com espada desembainhada.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 10; Espadachim; Saque Rápido; Iaido; Ataque em Movimento."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-issen",
    "key": "res-hijutsus1-issen",
    "name": "Issen",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 77,
    "pdfPage": 77,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 12; Espírito 12; Sabre Samurai; Ambidestria",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 12; Espírito 12; Sabre Samurai; Ambidestria",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 12,
              "label": "Destreza"
            },
            {
              "fact": "attribute.esp",
              "min": 12,
              "label": "Espírito"
            },
            {
              "fact": "aptitude.res-hijutsus1-sabre-samurai",
              "label": "Aptidão: Sabre Samurai"
            },
            {
              "fact": "aptitude.ambidestria",
              "label": "Aptidão: ambidestria"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia Corte de Chakra com duas espadas e permite Hadan.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 12; Espírito 12; Sabre Samurai; Ambidestria"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-armadura-samurai",
    "key": "res-hijutsus1-armadura-samurai",
    "name": "Armadura Samurai",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 78,
    "pdfPage": 78,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Força 10 ou Vigor 12",
    "levels": [
      {
        "level": 1,
        "requirements": "Força 10 ou Vigor 12",
        "checks": {
          "all": [
            {
              "review": "Conferir: Força 10 ou Vigor 12"
            }
          ]
        },
        "review": true,
        "cost": 2,
        "reviewReason": "Escolhas ou requisitos não numéricos devem ser conferidos pelo mestre."
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Concede treinamento e acesso à armadura exclusiva dos samurais.",
    "grantPlans": [
      {
        "benefitKey": "usar-armaduras-pesadas",
        "selection": "",
        "level": 1,
        "automatic": false,
        "application": "RES-002"
      }
    ],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Força 10 ou Vigor 12"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": true,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "assisted",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-impedir-selos",
    "key": "res-hijutsus1-impedir-selos",
    "name": "Impedir Selos",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 78,
    "pdfPage": 78,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 12; Espadachim; Saque Rápido; Iaido.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 12; Espadachim; Saque Rápido; Iaido.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 12,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.res-hijutsus1-espadachim",
              "label": "Aptidão: Espadachim"
            },
            {
              "fact": "aptitude.saque-rapido",
              "label": "Aptidão: saque-rapido"
            },
            {
              "fact": "aptitude.res-hijutsus1-iaido",
              "label": "Aptidão: Iaido"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Permite interromper selos inimigos com ataque específico.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 12; Espadachim; Saque Rápido; Iaido."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-hijutsus1-iaigiri",
    "key": "res-hijutsus1-iaigiri",
    "name": "Iaigiri",
    "kind": "hijutsu",
    "origin": "samurai",
    "accessOrigins": [
      "samurai"
    ],
    "book": "hijutsus1",
    "page": 78,
    "pdfPage": 78,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Destreza 14; Espadachim; Saque Rápido; Iaido.",
    "levels": [
      {
        "level": 1,
        "requirements": "Destreza 14; Espadachim; Saque Rápido; Iaido.",
        "checks": {
          "all": [
            {
              "fact": "attribute.des",
              "min": 14,
              "label": "Destreza"
            },
            {
              "fact": "aptitude.res-hijutsus1-espadachim",
              "label": "Aptidão: Espadachim"
            },
            {
              "fact": "aptitude.saque-rapido",
              "label": "Aptidão: saque-rapido"
            },
            {
              "fact": "aptitude.res-hijutsus1-iaido",
              "label": "Aptidão: Iaido"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Modifica o golpe de misericórdia com Iaido.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Destreza 14; Espadachim; Saque Rápido; Iaido."
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-kagura-shingan",
    "key": "res-basico-kagura-shingan",
    "name": "Kagura Shingan",
    "kind": "hijutsu",
    "origin": "kagura-shingan",
    "accessOrigins": [
      "kagura-shingan",
      "uzumaki"
    ],
    "book": "basico",
    "page": 222,
    "pdfPage": 222,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Rastrear 1",
    "levels": [
      {
        "level": 1,
        "requirements": "Rastrear 1",
        "checks": {
          "all": [
            {
              "fact": "skill.rastrear",
              "min": 1,
              "label": "Rastrear"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": true,
    "freeReview": false,
    "benefits": "Permite sensoriamento de chakra com capacidades condicionais.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Rastrear 1"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "originVariants": {
      "uzumaki": [
        "option2"
      ]
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  },
  {
    "id": "res-basico-ryoushitsu-kagura-shingan",
    "key": "res-basico-ryoushitsu-kagura-shingan",
    "name": "Ryoushitsu Kagura Shingan",
    "kind": "hijutsu",
    "origin": "kagura-shingan",
    "accessOrigins": [
      "kagura-shingan",
      "uzumaki"
    ],
    "book": "basico",
    "page": 223,
    "pdfPage": 223,
    "edition": "4.1.b",
    "category": "Restrita",
    "requirements": "Kagura Shingan; Rastrear 6",
    "levels": [
      {
        "level": 1,
        "requirements": "Kagura Shingan; Rastrear 6",
        "checks": {
          "all": [
            {
              "fact": "aptitude.res-basico-kagura-shingan",
              "label": "Aptidão: Kagura Shingan"
            },
            {
              "fact": "skill.rastrear",
              "min": 6,
              "label": "Rastrear"
            }
          ]
        },
        "review": false,
        "cost": 2,
        "reviewReason": ""
      }
    ],
    "maxLevel": 1,
    "acquisitionCost": 2,
    "costSource": {
      "book": "basico",
      "page": 56
    },
    "free": false,
    "freeReview": true,
    "benefits": "Amplia alcance e supressão de chakra do Kagura Shingan.",
    "grantPlans": [],
    "resources": [],
    "restrictions": [
      "Benefícios individuais e concessões não são aplicados pela RES-001."
    ],
    "relationships": [
      "Kagura Shingan; Rastrear 6"
    ],
    "futureAutomation": [
      "Implementar e validar efeitos individuais, concessões e recursos conforme a fonte em RES-002."
    ],
    "automation": "manual",
    "status": "catalogado",
    "review": false,
    "repeatable": false,
    "originVariants": {
      "uzumaki": [
        "option2"
      ]
    },
    "coverage": {
      "catalogue": "source-identified",
      "acquisition": "numeric-and-origin-checks",
      "individualEffects": "RES-002",
      "grantApplication": "RES-002",
      "resourceConsumption": "not-implemented"
    }
  }
];
