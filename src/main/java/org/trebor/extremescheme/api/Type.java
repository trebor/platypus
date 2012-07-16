package org.trebor.extremescheme.api;

import java.util.Collection;

public interface Type
{
  String getName();
  Collection<String> getPropertyNames();
}
