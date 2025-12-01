export enum TipoAeronave {
  Comercial = "Comercial",
  Militar = "Militar",
}

export type FuncionarioCadastroPayload = Omit<Funcionario, "id"> & {
    endereco: Omit<Endereco, "id" | "funcionarioId">;
    telefone: Omit<Telefone, "id" | "funcionarioId">;
};

export type Endereco = {
  id?: number;
  rua: string;
  numero: number;
  bairro: string;
  cidade: string;
  funcionarioId?: number;
};

export type Telefone = {
  id?: number;
  ddd: string;
  numero: string;
  funcionarioId?: number;
};


export enum tipoPeca {
  Nacional = "Nacional",
  Internacional = "Importada",
}

export enum statusPeca {
  Producao = "Em_producao",
  Estoque = "Em_transporte",
  Pronta = "Pronta_para_uso",
}

export enum producao {
  Pendente = "Pendente",
  Andamento = "Em Andamento",
  Concluido = "Concluído",
}

export enum tipoTeste {
  Eletrico = "Eletrico",
  Hidraulico = "Hidraulico",
  Aerodinamico = "Aerodinamico",
}

export enum Hierarquia {
  Administrador = "Administrador",
  Gerente = "Gerente",
  Operador = "Operador",
}

export interface Aeronave {
  codigo: number;
  modelo: string;
  tipo: TipoAeronave;
  capacidade: number;
  autonomia: number;
}

export interface Peca {
  id: number;
  nome: string;
  tipo: tipoPeca;
  fornecedor: string;
  status: statusPeca;
  aeronaveId: number;
}

export interface Etapa {
  id: number;
  nome: string;
  dataPrevista: string;
  status: producao;
  aeronaveId: number;
}

export interface Teste {
  id: number;
  tipo: tipoTeste;
  data: string;
  resultado: "Aprovado" | "Reprovado";
  aeronaveId: number;
}

export interface Relatorio {
  id: number;
  data: string;
  autor: string;
  aeronaveId: number;
}

export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  cargo: Hierarquia;
  login: string;
  senha?: string;
}



