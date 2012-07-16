package org.trebor.extremescheme.api;

import java.util.Collection;

public interface Model
{
  Thing create(Type type);
  Collection<Thing> getAll(Type type);
  Collection<Relationship> get(Thing thing);
  void relate(Thing thing1, Thing thing2);
}
