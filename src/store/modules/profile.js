import * as R from 'ramda'
import http from '@/utils/http'

const PROFILE_ID = 'profile'

export default {
  state: {
    data: {},
    id: '',
    error: null,
  },
  mutations: {
    SET_DATA (state, { name, data }) {
      state[name] = data
    },
    REST_ID (state) {
      state.id = ''
    },
  },
  actions: {
    async get ({ commit, dispatch }) {
      try {
        const response = await http.get(`/v1/parameters/${PROFILE_ID}`)
        if (!R.isNil(response.data) && !R.isEmpty(response.data)) {
          commit('SET_DATA', {
            name: 'data',
            data: response.data,
          })
          commit('SET_DATA', {
            name: 'id',
            data: response.data.id,
          })
          dispatch(
            'common/updateObject',
            {
              name: 'sidebar',
              data: {
                staredList: response.data.value?.staredList || [],
              },
            },
            { root: true },
          )
        }
        return response
      } catch (error) {
        if (error.response && error.response.status === 404) {
          try {
            const response = await http.post('/v1/parameters', {
              name: PROFILE_ID,
              value: {},
            })
            if (!R.isNil(response.data) && !R.isEmpty(response.data)) {
              commit('SET_DATA', {
                name: 'data',
                data: response.data,
              })
            }
            return response
          } catch (error) {
            throw error
          }
        } else {
          throw error
        }
      }
    },
    async update ({ commit, state }, payload) {
      try {
        const prev = state.data || {}
        const newValue = { ...(prev.value || {}), ...payload }
        // 先本地合并，避免 getter 仍读到旧 profile，导致设置「点了没效果」
        commit('SET_DATA', {
          name: 'data',
          data: {
            ...prev,
            value: newValue,
          },
        })
        const id = state.id || prev.id || PROFILE_ID
        const response = await http.put(`/v1/parameters/${id}`, {
          value: newValue,
        })
        if (!R.isNil(response.data) && !R.isEmpty(response.data)) {
          commit('SET_DATA', {
            name: 'data',
            data: {
              ...response.data,
              value: { ...(response.data.value || {}), ...newValue },
            },
          })
          commit('SET_DATA', {
            name: 'id',
            data: response.data.id,
          })
        }
        return response
      } catch (error) {
        throw error
      }
    },
  },
}
