import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import { ethers, utils } from 'ethers';

export default new Vuex.Store({
    state: {
        account: null,
        accountShares: null,

        provider: null,
        signer: null,
        chain: null,

        daoContract: null,
        daoStatics: null,

        approvedTokenContract: null,

        selectedDao: 'osaka',

        daos: {
            osaka: {
                name: '🌸 DAOsaka 🌸',
                key: 'osaka',
                address: '0x7D1a4fC6Df3B16eB894004A4586A29f39Ba6d205',
                unit: 'DAI',
            },
            moloch: {
                name: '👹 Moloch DAO 👹',
                key: 'moloch',
                address: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
                unit: 'wETH',
            },
            metacartel: {
                name: '🌶️ MetaCartel DAO 🌶️',
                key: 'metacartel',
                address: '0x0372f3696fa7dc99801f435fd6737e57818239f2',
                unit: 'wETH',
            },
            yang: {
                name: '️🌅 YangDAO 🌅',
                key: 'yang',
                address: '0xb3c02f093e6140ed2ad91be66b302f938cd8434f',
                unit: 'wETH',
            },
            orochi: {
                name: '🐍 Orochi DAO 🐍',
                key: 'orochi',
                address: '0x8487dcc6f4b28b911e22a8657ebb16427d4cf5c0',
                unit: 'wETH',
            },
            james: {
                name: '👩 James DAO 👩',
                key: 'james',
                address: '0x77b53ad9d111029d1f16f4f19769846384bda49b',
                unit: 'wETH',
            },
            trojan: {
                name: '🐴 TrojanDAO 🐴',
                key: 'trojan',
                address: '0xcc7dcdb700eed457c8180406d7d699877f4eee24',
                unit: 'wETH',
            },
            raid: {
                name: '⚔️ Raid Guild ⚔️',
                key: 'raid',
                address: '0xbd6fa666fbb6fdeb4fc5eb36cdd5c87b069b24c1',
                unit: 'wETH',
            },
        }
    },
    getters: {
        rootApi: (state) => {
            if (state.chainId === 5777) {
                return 'http://localhost:5000/block-cities/us-central1/api';
            }
            return 'https://us-central1-block-cities.cloudfunctions.net/api';
        },
        provider: (state) => state.provider,
        signer: (state) => state.signer,
        chain: (state) => state.chain,
        daoContract: (state) => state.daoContract,
        approvedTokenContract: (state) => state.approvedTokenContract,
        daoStatics: (state) => state.daoStatics,
        unit: (state) => state.daos[state.selectedDao].unit,
        doaName: (state) => state.daos[state.selectedDao].name,
        daos: (state) => state.daos,
        selectedDao: (state) => state.selectedDao,
        account: (state) => state.account,
        accountShares: (state) => state.accountShares,
    },
    mutations: {
        provider (state, provider) {
            state.provider = provider;
        },
        signer (state, signer) {
            state.signer = signer;
        },
        chain (state, chain) {
            state.chain = chain;
        },
        daoContract (state, daoContract) {
            state.daoContract = daoContract;
        },
        approvedTokenContract (state, approvedTokenContract) {
            state.approvedTokenContract = approvedTokenContract;
        },
        daoStatics (state, daoStatics) {
            state.daoStatics = daoStatics;
        },
        selectedDao (state, selectedDao) {
            state.selectedDao = selectedDao;
        },
        account (state, account) {
            state.account = account;
        },
        accountShares (state, accountShares) {
            state.accountShares = accountShares;
        },
    },
    actions: {
        async provider ({ commit, dispatch, state }, provider) {
            console.log('setting provider...');
            commit('provider', provider);
            commit('signer', provider.getSigner());

            const chain = await provider.getNetwork();
            commit('chain', chain);

            const accounts = await provider.listAccounts();
            const account = accounts && accounts.length ? accounts[0] : null;
            commit('account', account);

            dispatch('daoContract', state.selectedDao);
        },

        async daoContract({ commit, dispatch, state }, daoName){
            console.log(`loading dao contract: ${daoName}`);

            commit('daoStatics', null);

            commit('selectedDao', daoName);

            const daoContract = new ethers.Contract(
                state.daos[state.selectedDao].address,
                require('./abi/molach-abi'),
                state.signer
            );
            commit('daoContract', daoContract);

            dispatch('contractStatics');

            dispatch('accountStats');
        },

        async contractStatics({ commit, dispatch, state }) {
            console.log('loading static stuff...');

            const processingReward = await state.daoContract.processingReward();
            const currentPeriod = await state.daoContract.getCurrentPeriod();
            const totalShares = await state.daoContract.totalShares();
            const proposalDeposit = await state.daoContract.proposalDeposit();
            const summoningTime = await state.daoContract.summoningTime();
            const dilutionBound = await state.daoContract.dilutionBound();
            const approvedToken = await state.daoContract.approvedToken();
            const periodDuration = await state.daoContract.periodDuration();
            const votingPeriodLength = await state.daoContract.votingPeriodLength();
            const gracePeriodLength = await state.daoContract.gracePeriodLength();

            const guildBank = await state.daoContract.guildBank();

            const approvedTokenContract = new ethers.Contract(
                approvedToken,
                require('./abi/erc20-abi'),
                state.signer
            );
            commit('approvedTokenContract', approvedTokenContract);

            const guildBankApprovedTokenBalance = await approvedTokenContract.balanceOf(guildBank);
            const daoBalance = await approvedTokenContract.balanceOf(state.daoContract.address);

            commit('daoStatics', {
                processingReward,
                currentPeriod,
                totalShares,
                proposalDeposit,
                summoningTime,
                guildBank,
                dilutionBound,
                approvedToken,
                periodDuration,
                votingPeriodLength,
                gracePeriodLength,
                guildBankApprovedTokenBalance,
                daoBalance,
            });
        },

        async accountStats({ commit, dispatch, state }) {
            console.log('loading account stuff...');

            const member = await state.daoContract.members(state.account);
            commit('accountShares', member[1]);
        },
    }
});
