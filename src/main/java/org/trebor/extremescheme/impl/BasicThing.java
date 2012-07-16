package org.trebor.extremescheme.impl;

import java.util.Properties;

import org.trebor.extremescheme.api.Thing;
import org.trebor.extremescheme.api.Type;

public class BasicThing implements Thing
{
  private Properties mProperties;
  private Type mType;
  
  public BasicThing(Type type, Properties properties)
  {
    mProperties = properties;
    mType = type;
  }
  
  public Properties getProperties()
  {
    return mProperties;
  }

  public Type getType()
  {
    return mType;
  }

}
