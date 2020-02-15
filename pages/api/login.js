import { validateAuth } from '../../lib/util'

export default async (req, res) => {
  if (req.method != 'POST')
    return res.status(404).json({});

  if (validateAuth(req, res))
    res.status(200).json({});
  else
    res.status(401).json({error: "Invalid password"});
};
