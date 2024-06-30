function rmSensitive(doc) {
  return (({
    _id: id,
    password,
    tokens,
    accountConfirmed,
    allowedBranches,
    ...doc
  }) => {
    return {
      id,
      allowedBranches: allowedBranches.map(({ _id: id, ...doc }) => {
        return { id, ...doc };
      }),
      ...doc,
    };
  })(JSON.parse(JSON.stringify(doc)))
}

export default rmSensitive
