import { PrismaClient, Hierarquia, TipoAeronave, StatusProducao, TipoTeste, ResultadoTeste } from '@prisma/client' 

const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando o script de Seeding (SENHA PURA)...')

    const email = 'admnistr@dor.com'
    const cpf = '11122233344'         
    const loginFuncionario = 'admin.master' 
    const senhaTextoPuro = '123' 
    
    
    const existingFuncionario = await prisma.funcionario.findFirst({
        where: {
            OR: [
                { cpf: cpf },
                { login: loginFuncionario }
            ]
        },
        include: { user: true }
    });

    if (existingFuncionario) {
        if (!existingFuncionario.user) {
            await prisma.user.create({
                data: {
                    email: email,
                    password: senhaTextoPuro, 
                    funcionarioId: existingFuncionario.id
                }
            });
            console.log(`Usuário (User) recriado/vinculado para o CPF ${cpf}.`);
        }
        console.log(`Administrador Principal já existe (ID: ${existingFuncionario.id}). Ignorando a criação.`);
        
    } else {
        const newFuncionario = await prisma.funcionario.create({
            data: {
                nome: 'Administrador Principal',
                cpf: cpf,
                cargo: Hierarquia.Administrador, 
                login: loginFuncionario,         
                senha: senhaTextoPuro, 
            }
        });
        
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: senhaTextoPuro, 
                funcionarioId: newFuncionario.id
            }
        });

        console.log(`Novo Administrador criado. Login: ${newUser.email} / SENHA: ${senhaTextoPuro}`);
    }

    const aeronaveCodigoTeste = 1000;
    
    try {
        await prisma.peca.deleteMany({ where: { aeronaveId: aeronaveCodigoTeste } });
        await prisma.etapa.deleteMany({ where: { aeronaveId: aeronaveCodigoTeste } });
        await prisma.teste.deleteMany({ where: { aeronaveId: aeronaveCodigoTeste } });
        await prisma.aeronave.delete({ where: { codigo: aeronaveCodigoTeste } });
        console.log(`Limpeza da Aeronave de teste ${aeronaveCodigoTeste} concluída.`);
    } catch (e) {
    }
    
    try {
        const aeronaveTeste = await prisma.aeronave.create({
            data: {
                codigo: aeronaveCodigoTeste, 
                modelo: 'Boeing 737 MAX 8',
                tipo: TipoAeronave.Comercial,
                capacidade: 180,
                autonomia: 6500,
            }
        });
        
        console.log(`\n✈️ Aeronave de teste criada: ${aeronaveTeste.modelo} (Código: ${aeronaveTeste.codigo})`);

        const etapasData = [
            { nome: 'Montagem da Fuselagem', dataPrevista: new Date('2025-12-01'), status: StatusProducao.Concluido },
            { nome: 'Instalação da Aviônica', dataPrevista: new Date('2025-12-10'), status: StatusProducao.Concluido },
            { nome: 'Pintura e Acabamento Final', dataPrevista: new Date('2025-12-15'), status: StatusProducao.Concluido },
        ];
        
        const adminFuncionarioId = existingFuncionario?.id ?? (await prisma.funcionario.findFirst({ where: { cpf: cpf } }))?.id ?? 1;

        for (const etapa of etapasData) {
            await prisma.etapa.create({
                data: {
                    ...etapa,
                    aeronaveId: aeronaveTeste.codigo,
                    funcionarios: {
                        create: [{ funcionarioId: adminFuncionarioId }], 
                    },
                },
            });
        }

        const testesData = [
            { tipo: TipoTeste.Eletrico, resultado: ResultadoTeste.Aprovado, data: new Date('2025-12-16') },
            { tipo: TipoTeste.Hidraulico, resultado: ResultadoTeste.Aprovado, data: new Date('2025-12-17') },
            { tipo: TipoTeste.Aerodinamico, resultado: ResultadoTeste.Aprovado, data: new Date('2025-12-18') },
        ];

        for (const teste of testesData) {
            await prisma.teste.create({
                data: {
                    ...teste,
                    aeronaveId: aeronaveTeste.codigo,
                },
            });
        }
        
        console.log('Dados de teste (Etapas e Testes Aprovados) adicionados para a aeronave de teste.');

    } catch (e) {
        console.error('\n Aviso: Falha ao criar a Aeronave de Teste. O código da aeronave (1000) pode estar em uso ou a tabela não aceita ID fixo.');
        console.error(e);
    }
}

main()
    .catch(e => {
        console.error('Erro fatal durante o seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });