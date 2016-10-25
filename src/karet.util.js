import * as A     from "kefir.atom"
import * as Kefir from "kefir"
import * as L     from "partial.lenses"
import * as R     from "ramda"
import K          from "kefir.combines"
import React      from "karet"

export default K

//

export const setProps = template => {
  let observable
  let callback
  return e => {
    if (callback) {
      observable.offAny(callback)
      observable = callback = null
    }
    if (e) {
      callback = ev => {
        switch (ev.type) {
          case "value": {
            const template = ev.value
            for (const k in template)
              e[k] = template[k]
            break
          }
          case "error":
            throw ev.value
          case "end":
            observable = callback = null
            break
        }
      }
      observable = K(template, R.identity)
      observable.onAny(callback)
    }
  }
}

export const getProps = template => ({target}) => {
  for (const k in template)
    template[k].set(target[k])
}

export const bindProps = ({ref, ...template}) =>
  ({ref: setProps(template), [ref]: getProps(template)})

export const bind = template =>
  ({...template, onChange: getProps(template)})

//

function classesImmediate() {
  let result = ""
  for (let i=0, n=arguments.length; i<n; ++i) {
    const a = arguments[i]
    if (a) {
      if (result)
        result += " "
      result += a
    }
  }
  return result
}

export const classes = (...cs) =>
  ({className: K(...cs, classesImmediate)})

//

export class Idx {
  constructor(id, index) {
    this.id = id
    this.index = index
  }
  toString() {
    return `${this.id}:${this.index}`
  }
}

export const idx = id => (x, i) => new Idx(x[id], i)

const mapCachedInit = [{}, []]

const mapCachedStep = fromId => ([oldIds], ids) => {
  const newIds = {}
  const newVs = Array(ids.length)
  for (let i=0, n=ids.length; i<n; ++i) {
    const id = ids[i]
    const k = id.toString()
    if (k in newIds)
      newVs[i] = newIds[k]
    else
      newIds[k] = newVs[i] = k in oldIds ? oldIds[k] : fromId(id)
  }
  return [newIds, newVs]
}

const mapCachedMap = x => x[1]

export const mapCached = fromId => ids =>
  ids instanceof Kefir.Observable
  ? ids.scan(mapCachedStep(fromId), mapCachedInit).map(mapCachedMap)
  : mapCachedMap(mapCachedStep(fromId)(mapCachedInit, ids))

export const fromIds = (ids, fromId) => mapCached(fromId)(ids)

//

export const lift = fn => (...args) => K(...args, fn)

//

export const seq = (x, ...fns) => {
  let r = x
  for (let i=0, n=fns.length; i<n; ++i)
    r = fns[i](r)
  return r
}

export const pipe = (...fns) => lift(R.pipe(...fns))

//

export const mapIndexed = xi2y => lift(xs => xs.map((x, i) => xi2y(x, i)))

export const indices = pipe(R.length, R.range(0))

//

const viewProp = (l, xs) => K(xs, L.get(l))

export const view = R.curry((l, xs) =>
  xs instanceof A.AbstractMutable ? xs.view(l) : viewProp(l, xs))

//

const toNull = () => null

export const sink = stream => K(Kefir.constant(null).concat(stream), toNull)

//

const types = {context: React.PropTypes.any}

export class Context extends React.Component {
  constructor(props) {
    super(props)
  }
  getChildContext() {
    return {context: this.props.context}
  }
  render() {
    return this.props.children
  }
}

Context.childContextTypes = types

export const withContext = originalFn => {
  const fn = (props, {context}) => originalFn(props, context)
  fn.contextTypes = types
  return fn
}

//

const actionsImmediate = (...fns) => (...args) => {
  for (let i=0, n=fns.length; i<n; ++i)
    if (fns[i] instanceof Function)
      fns[i](...args)
}

export const actions = (...fns) => K(...fns, actionsImmediate)

//

export const string = (strings, ...values) =>
  K(...values, (...values) => String.raw(strings, ...values))

//

export const atom = value => new A.Atom(value)
export const variable = () => new A.Atom()
export const molecule = template => new A.Molecule(template)

export const holding = A.holding
